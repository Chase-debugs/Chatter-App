'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, ConversationWithDetails, Friendship, Block } from '@/lib/types'

interface ChatContextType {
  currentUser: Profile
  conversations: ConversationWithDetails[]
  friends: Profile[]
  pendingRequests: Friendship[]
  blockedUsers: Block[]
  activeConversation: ConversationWithDetails | null
  setActiveConversation: (conv: ConversationWithDetails | null) => void
  refreshConversations: () => Promise<void>
  refreshFriends: () => Promise<void>
  refreshBlocks: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | null>(null)

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}

export function ChatProvider({ 
  children, 
  currentUser 
}: { 
  children: ReactNode
  currentUser: Profile 
}) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([])
  const [blockedUsers, setBlockedUsers] = useState<Block[]>([])
  const [activeConversation, setActiveConversation] = useState<ConversationWithDetails | null>(null)
  
  const supabase = createClient()

  const refreshConversations = useCallback(async () => {
    // Get conversations the user is a member of
    const { data: memberData } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', currentUser.id)

    if (!memberData || memberData.length === 0) {
      setConversations([])
      return
    }

    const conversationIds = memberData.map(m => m.conversation_id)

    // Get conversation details with members
    const { data: convData } = await supabase
      .from('conversations')
      .select(`
        *,
        members:conversation_members(
          *,
          profile:profiles(*)
        )
      `)
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })

    if (convData) {
      // Get last message for each conversation
      const conversationsWithMessages = await Promise.all(
        convData.map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*, sender:profiles(*)')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...conv,
            last_message: lastMessage || undefined,
          } as ConversationWithDetails
        })
      )
      
      setConversations(conversationsWithMessages)
    }
  }, [currentUser.id, supabase])

  const refreshFriends = useCallback(async () => {
    // Get accepted friendships
    const { data: friendships } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:profiles!friendships_requester_id_fkey(*),
        addressee:profiles!friendships_addressee_id_fkey(*)
      `)
      .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)

    if (friendships) {
      const acceptedFriends = friendships
        .filter(f => f.status === 'accepted')
        .map(f => f.requester_id === currentUser.id ? f.addressee : f.requester)
        .filter(Boolean) as Profile[]

      const pending = friendships.filter(
        f => f.status === 'pending' && f.addressee_id === currentUser.id
      )

      setFriends(acceptedFriends)
      setPendingRequests(pending)
    }
  }, [currentUser.id, supabase])

  const refreshBlocks = useCallback(async () => {
    const { data } = await supabase
      .from('blocks')
      .select('*, blocked:profiles!blocks_blocked_id_fkey(*)')
      .eq('blocker_id', currentUser.id)

    if (data) {
      setBlockedUsers(data as Block[])
    }
  }, [currentUser.id, supabase])

  // Initial load
  useEffect(() => {
    refreshConversations()
    refreshFriends()
    refreshBlocks()
  }, [refreshConversations, refreshFriends, refreshBlocks])

  // Update user status to online
  useEffect(() => {
    const updateStatus = async () => {
      await supabase
        .from('profiles')
        .update({ status: 'online' })
        .eq('id', currentUser.id)
    }
    updateStatus()

    // Set offline when leaving
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        '/api/status',
        JSON.stringify({ userId: currentUser.id, status: 'offline' })
      )
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [currentUser.id, supabase])

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        conversations,
        friends,
        pendingRequests,
        blockedUsers,
        activeConversation,
        setActiveConversation,
        refreshConversations,
        refreshFriends,
        refreshBlocks,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
