'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatContext } from './chat-provider'
import { UserAvatar } from './user-avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Check, X, Shield } from 'lucide-react'

export function PendingRequests() {
  const { pendingRequests, refreshFriends, refreshBlocks, currentUser } = useChatContext()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const supabase = createClient()

  const acceptRequest = async (requestId: string) => {
    setLoadingId(requestId)
    
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    await refreshFriends()
    setLoadingId(null)
  }

  const declineRequest = async (requestId: string) => {
    setLoadingId(requestId)
    
    await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId)

    await refreshFriends()
    setLoadingId(null)
  }

  const blockAndDecline = async (requestId: string, userId: string) => {
    setLoadingId(requestId)
    
    // Block user
    await supabase.from('blocks').insert({
      blocker_id: currentUser.id,
      blocked_id: userId,
    })

    // Delete request
    await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId)

    await refreshFriends()
    await refreshBlocks()
    setLoadingId(null)
  }

  if (pendingRequests.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No pending requests</h3>
          <p className="text-muted-foreground">
            Friend requests you receive will appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {pendingRequests.map((request) => {
        const requester = request.requester
        if (!requester) return null

        return (
          <Card key={request.id} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <UserAvatar
                  src={requester.avatar_url}
                  fallback={requester.display_name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {requester.display_name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{requester.username}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => acceptRequest(request.id)}
                    disabled={loadingId === request.id}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => declineRequest(request.id)}
                    disabled={loadingId === request.id}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => blockAndDecline(request.id, requester.id)}
                    disabled={loadingId === request.id}
                    title="Block user"
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
