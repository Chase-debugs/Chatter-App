'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ConversationWithDetails, Message, Profile } from '@/lib/types'
import { useChatContext } from './chat-provider'
import { ConversationHeader } from './conversation-header'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'

interface ConversationViewProps {
  conversation: ConversationWithDetails
  initialMessages: (Message & { sender: Profile })[]
  currentUser: Profile
}

export function ConversationView({
  conversation,
  initialMessages,
  currentUser,
}: ConversationViewProps) {
  const [messages, setMessages] = useState(initialMessages)
  const { refreshConversations } = useChatContext()
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          // Fetch the full message with sender
          const { data: newMessage } = await supabase
            .from('messages')
            .select('*, sender:profiles(*)')
            .eq('id', payload.new.id)
            .single()

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage as Message & { sender: Profile }])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id, supabase])

  const sendMessage = async (content: string, imageUrl?: string) => {
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: currentUser.id,
      content: content || null,
      image_url: imageUrl || null,
    })

    if (!error) {
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id)
      
      refreshConversations()
    }

    return !error
  }

  const deleteMessage = async (messageId: string) => {
    await supabase.from('messages').delete().eq('id', messageId)
  }

  // Get display info
  const otherMembers = conversation.members?.filter(
    (m) => m.user_id !== currentUser.id
  )
  const displayName = conversation.is_group
    ? conversation.name || 'Group Chat'
    : otherMembers?.[0]?.profile?.display_name || 'Unknown'
  const displayAvatar = conversation.is_group
    ? null
    : otherMembers?.[0]?.profile?.avatar_url

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ConversationHeader
        name={displayName}
        avatarUrl={displayAvatar}
        isGroup={conversation.is_group}
        memberCount={conversation.members?.length || 0}
        members={otherMembers}
      />
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          currentUserId={currentUser.id}
          onDeleteMessage={deleteMessage}
        />
      </div>
      <MessageInput onSendMessage={sendMessage} />
    </div>
  )
}
