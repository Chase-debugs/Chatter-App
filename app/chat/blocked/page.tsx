'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatContext } from '@/components/chat/chat-provider'
import { UserAvatar } from '@/components/chat/user-avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, UserCheck } from 'lucide-react'

export default function BlockedPage() {
  const { blockedUsers, refreshBlocks } = useChatContext()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const supabase = createClient()

  const unblockUser = async (blockId: string) => {
    setLoadingId(blockId)
    
    await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId)

    await refreshBlocks()
    setLoadingId(null)
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 px-4 flex items-center border-b border-border">
        <Shield className="w-5 h-5 text-muted-foreground mr-2" />
        <h1 className="text-lg font-semibold text-foreground">Blocked Users</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-3xl mx-auto">
          {blockedUsers.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No blocked users</h3>
                <p className="text-muted-foreground">
                  Users you block will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((block) => {
                const blocked = block.blocked
                if (!blocked) return null

                return (
                  <Card key={block.id} className="border-border bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <UserAvatar
                          src={blocked.avatar_url}
                          fallback={blocked.display_name}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {blocked.display_name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            @{blocked.username}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => unblockUser(block.id)}
                          disabled={loadingId === block.id}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Unblock
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
