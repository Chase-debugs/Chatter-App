import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ConversationView } from '@/components/chat/conversation-view'
import type { ConversationWithDetails, Message, Profile } from '@/lib/types'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is a member of this conversation
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    notFound()
  }

  // Get conversation with members
  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      *,
      members:conversation_members(
        *,
        profile:profiles(*)
      )
    `)
    .eq('id', conversationId)
    .single()

  if (!conversation) {
    notFound()
  }

  // Get initial messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(50)

  // Get current user profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <ConversationView
      conversation={conversation as ConversationWithDetails}
      initialMessages={(messages || []) as (Message & { sender: Profile })[]}
      currentUser={currentProfile as Profile}
    />
  )
}
