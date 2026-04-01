'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useChatContext } from './chat-provider'
import { UserAvatar } from './user-avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle, MoreVertical, UserMinus, Shield, Users } from 'lucide-react'
import type { Profile } from '@/lib/types'

export function FriendsList() {
  const { friends, currentUser, refreshFriends, refreshConversations, refreshBlocks } = useChatContext()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const startDM = async (friend: Profile) => {
    setLoadingId(friend.id)
    
    // Check if DM already exists
    const { data: existingConvs } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', currentUser.id)

    if (existingConvs) {
      for (const conv of existingConvs) {
        const { data: members } = await supabase
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', conv.conversation_id)

        const { data: convData } = await supabase
          .from('conversations')
          .select('is_group')
          .eq('id', conv.conversation_id)
          .single()

        if (members && convData && !convData.is_group && members.length === 2) {
          const otherMember = members.find(m => m.user_id !== currentUser.id)
          if (otherMember?.user_id === friend.id) {
            router.push(`/chat/${conv.conversation_id}`)
            setLoadingId(null)
            return
          }
        }
      }
    }

    // Create new DM
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        is_group: false,
        created_by: currentUser.id,
      })
      .select()
      .single()

    if (convError || !newConv) {
      setLoadingId(null)
      return
    }

    // Add members
    await supabase.from('conversation_members').insert([
      { conversation_id: newConv.id, user_id: currentUser.id },
      { conversation_id: newConv.id, user_id: friend.id },
    ])

    await refreshConversations()
    router.push(`/chat/${newConv.id}`)
    setLoadingId(null)
  }

  const removeFriend = async (friendId: string) => {
    setLoadingId(friendId)
    
    // Delete friendship (works for both directions)
    await supabase
      .from('friendships')
      .delete()
      .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${currentUser.id})`)

    await refreshFriends()
    setLoadingId(null)
  }

  const blockUser = async (userId: string) => {
    setLoadingId(userId)
    
    // Add block
    await supabase.from('blocks').insert({
      blocker_id: currentUser.id,
      blocked_id: userId,
    })

    // Remove friendship if exists
    await supabase
      .from('friendships')
      .delete()
      .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id})`)

    await refreshFriends()
    await refreshBlocks()
    setLoadingId(null)
  }

  if (friends.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No friends yet</h3>
          <p className="text-muted-foreground">
            Add friends to start chatting with them!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {friends.map((friend) => (
        <Card key={friend.id} className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <UserAvatar
                src={friend.avatar_url}
                fallback={friend.display_name}
                size="md"
                status={friend.status as 'online' | 'offline' | 'away' | 'dnd'}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {friend.display_name}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  @{friend.username}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => startDM(friend)}
                  disabled={loadingId === friend.id}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Message
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => removeFriend(friend.id)}>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove Friend
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => blockUser(friend.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Block
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
