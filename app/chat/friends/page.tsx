'use client'

import { useState } from 'react'
import { useChatContext } from '@/components/chat/chat-provider'
import { FriendsList } from '@/components/chat/friends-list'
import { AddFriend } from '@/components/chat/add-friend'
import { PendingRequests } from '@/components/chat/pending-requests'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, UserPlus, Clock } from 'lucide-react'

export default function FriendsPage() {
  const { friends, pendingRequests } = useChatContext()
  const [activeTab, setActiveTab] = useState('all')

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 px-4 flex items-center border-b border-border">
        <Users className="w-5 h-5 text-muted-foreground mr-2" />
        <h1 className="text-lg font-semibold text-foreground">Friends</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 bg-secondary mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              All Friends
              {friends.length > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 rounded">
                  {friends.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
              {pendingRequests.length > 0 && (
                <span className="text-xs bg-destructive text-destructive-foreground px-1.5 rounded">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Friend
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <FriendsList />
          </TabsContent>

          <TabsContent value="pending">
            <PendingRequests />
          </TabsContent>

          <TabsContent value="add">
            <AddFriend />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
