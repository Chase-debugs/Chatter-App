import { MessageCircle, Users, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ChatPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Welcome to Chatter
        </h2>
        <p className="text-muted-foreground mb-8">
          Select a conversation from the sidebar or start a new chat with a friend.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild>
            <Link href="/chat/friends">
              <Users className="w-4 h-4 mr-2" />
              View Friends
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/chat/new">
              <UserPlus className="w-4 h-4 mr-2" />
              Start New Chat
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
