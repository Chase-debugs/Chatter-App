import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatProvider } from '@/components/chat/chat-provider'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  return (
    <ChatProvider currentUser={profile}>
      <div className="h-screen flex bg-background overflow-hidden">
        <ChatSidebar currentUser={profile} />
        <main className="flex-1 flex flex-col min-w-0">
          {children}
        </main>
      </div>
    </ChatProvider>
  )
}
