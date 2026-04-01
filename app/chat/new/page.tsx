'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useChatContext } from '@/components/chat/chat-provider'
import { UserAvatar } from '@/components/chat/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { MessageSquarePlus, Loader2, Users, Search } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default function NewChatPage() {
  const { friends, currentUser, refreshConversations } = useChatContext()
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isGroup = selectedFriends.length > 1

  const filteredFriends = friends.filter(
    (friend) =>
      friend.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    )
  }

  const createConversation = async () => {
    if (selectedFriends.length === 0) return

    setLoading(true)

    try {
      // For 1:1 DMs, check if conversation already exists
      if (!isGroup) {
        const friendId = selectedFriends[0]
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
              const otherMember = members.find((m) => m.user_id !== currentUser.id)
              if (otherMember?.user_id === friendId) {
                await refreshConversations()
                router.push(`/chat/${conv.conversation_id}`)
                return
              }
            }
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          name: isGroup ? groupName || null : null,
          is_group: isGroup,
          created_by: currentUser.id,
        })
        .select()
        .single()

      if (convError || !newConv) {
        throw new Error('Failed to create conversation')
      }

      // Add all members including current user
      const members = [currentUser.id, ...selectedFriends].map((userId) => ({
        conversation_id: newConv.id,
        user_id: userId,
      }))

      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert(members)

      if (membersError) {
        throw new Error('Failed to add members')
      }

      await refreshConversations()
      router.push(`/chat/${newConv.id}`)
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert('Failed to create conversation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 px-4 flex items-center border-b border-border">
        <MessageSquarePlus className="w-5 h-5 text-muted-foreground mr-2" />
        <h1 className="text-lg font-semibold text-foreground">New Conversation</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Group Name (if multiple selected) */}
          {isGroup && (
            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-xs font-bold uppercase text-muted-foreground">
                Group Name (Optional)
              </Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter a group name"
                className="bg-input border-border"
              />
            </div>
          )}

          {/* Search */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Select Friends
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="pl-10 bg-input border-border"
              />
            </div>
          </div>

          {/* Friends List */}
          {friends.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No friends yet</h3>
                <p className="text-muted-foreground">
                  Add friends first to start a conversation
                </p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => router.push('/chat/friends')}
                >
                  Add Friends
                </Button>
              </CardContent>
            </Card>
          ) : filteredFriends.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No friends match your search</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredFriends.map((friend) => (
                <Card
                  key={friend.id}
                  className={`border-border bg-card cursor-pointer transition-colors ${
                    selectedFriends.includes(friend.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => toggleFriend(friend.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedFriends.includes(friend.id)}
                        onCheckedChange={() => toggleFriend(friend.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <UserAvatar
                        src={friend.avatar_url}
                        fallback={friend.display_name}
                        size="sm"
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Button */}
          {selectedFriends.length > 0 && (
            <div className="sticky bottom-4">
              <Button
                className="w-full"
                onClick={createConversation}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : isGroup ? (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Create Group ({selectedFriends.length + 1} members)
                  </>
                ) : (
                  <>
                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                    Start Conversation
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
