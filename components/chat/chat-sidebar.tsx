'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'
import { useChatContext } from './chat-provider'
import { UserAvatar } from './user-avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MessageCircle,
  Users,
  Settings,
  LogOut,
  Plus,
  UserPlus,
  Shield,
} from 'lucide-react'

interface ChatSidebarProps {
  currentUser: Profile
}

export function ChatSidebar({ currentUser }: ChatSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { conversations, pendingRequests } = useChatContext()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    {
      href: '/chat/friends',
      icon: Users,
      label: 'Friends',
      badge: pendingRequests.length > 0 ? pendingRequests.length : undefined,
    },
    {
      href: '/chat/blocked',
      icon: Shield,
      label: 'Blocked',
    },
  ]

  return (
    <div className="w-72 bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">Chatter</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Conversations Header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-sidebar-foreground/50">
          Direct Messages
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-sidebar-foreground/50 hover:text-sidebar-foreground"
          asChild
        >
          <Link href="/chat/new">
            <Plus className="w-4 h-4" />
            <span className="sr-only">New conversation</span>
          </Link>
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 pb-4">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-sidebar-foreground/50">No conversations yet</p>
              <Button
                variant="link"
                size="sm"
                className="text-sidebar-primary mt-2"
                asChild
              >
                <Link href="/chat/friends">
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add friends to start chatting
                </Link>
              </Button>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = pathname === `/chat/${conv.id}`
              const otherMembers = conv.members?.filter(
                (m) => m.user_id !== currentUser.id
              )
              const displayName = conv.is_group
                ? conv.name || 'Group Chat'
                : otherMembers?.[0]?.profile?.display_name || 'Unknown'
              const displayAvatar = conv.is_group
                ? null
                : otherMembers?.[0]?.profile?.avatar_url

              return (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    isActive
                      ? 'bg-sidebar-accent'
                      : 'hover:bg-sidebar-accent/50'
                  )}
                >
                  <UserAvatar
                    src={displayAvatar}
                    fallback={displayName}
                    size="sm"
                    isGroup={conv.is_group}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {displayName}
                    </p>
                    {conv.last_message && (
                      <p className="text-xs text-sidebar-foreground/50 truncate">
                        {conv.last_message.content || 'Sent an image'}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* User Panel */}
      <div className="p-2 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent/50 transition-colors">
              <UserAvatar
                src={currentUser.avatar_url}
                fallback={currentUser.display_name}
                size="sm"
                status="online"
              />
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {currentUser.display_name}
                </p>
                <p className="text-xs text-sidebar-foreground/50 truncate">
                  @{currentUser.username}
                </p>
              </div>
              <Settings className="w-4 h-4 text-sidebar-foreground/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/chat/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
