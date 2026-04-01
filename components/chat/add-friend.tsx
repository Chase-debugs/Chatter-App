'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatContext } from './chat-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Loader2, Check, X } from 'lucide-react'

export function AddFriend() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { currentUser, refreshFriends, blockedUsers } = useChatContext()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const searchUsername = username.toLowerCase().trim()

    if (searchUsername === currentUser.username) {
      setMessage({ type: 'error', text: "You can't add yourself as a friend!" })
      setLoading(false)
      return
    }

    // Find user by username
    const { data: targetUser, error: findError } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('username', searchUsername)
      .single()

    if (findError || !targetUser) {
      setMessage({ type: 'error', text: 'User not found. Check the username and try again.' })
      setLoading(false)
      return
    }

    // Check if user is blocked
    const isBlocked = blockedUsers.some(b => b.blocked_id === targetUser.id)
    if (isBlocked) {
      setMessage({ type: 'error', text: 'You have blocked this user. Unblock them first to send a friend request.' })
      setLoading(false)
      return
    }

    // Check if we're blocked by them
    const { data: blockedByThem } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', targetUser.id)
      .eq('blocked_id', currentUser.id)
      .single()

    if (blockedByThem) {
      setMessage({ type: 'error', text: 'Unable to send friend request to this user.' })
      setLoading(false)
      return
    }

    // Check existing friendship
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id, status, requester_id')
      .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},addressee_id.eq.${currentUser.id})`)
      .single()

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        setMessage({ type: 'error', text: `You're already friends with ${targetUser.display_name}!` })
      } else if (existingFriendship.status === 'pending') {
        if (existingFriendship.requester_id === currentUser.id) {
          setMessage({ type: 'error', text: 'Friend request already sent!' })
        } else {
          // Accept their pending request
          await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', existingFriendship.id)
          
          setMessage({ type: 'success', text: `You're now friends with ${targetUser.display_name}!` })
          await refreshFriends()
        }
      }
      setLoading(false)
      setUsername('')
      return
    }

    // Create friend request
    const { error: insertError } = await supabase.from('friendships').insert({
      requester_id: currentUser.id,
      addressee_id: targetUser.id,
      status: 'pending',
    })

    if (insertError) {
      setMessage({ type: 'error', text: 'Failed to send friend request. Please try again.' })
    } else {
      setMessage({ type: 'success', text: `Friend request sent to ${targetUser.display_name}!` })
      setUsername('')
    }

    setLoading(false)
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <UserPlus className="w-5 h-5" />
          Add Friend
        </CardTitle>
        <CardDescription>
          Enter a username to send a friend request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-xs font-bold uppercase text-muted-foreground">
              Username
            </Label>
            <div className="flex gap-2">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a username"
                className="bg-input border-border text-foreground"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !username.trim()}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send Request'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Usernames are case-insensitive
            </p>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                message.type === 'success'
                  ? 'bg-accent/20 text-accent'
                  : 'bg-destructive/20 text-destructive'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
              {message.text}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
