'use client'

import { useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import type { Message, Profile } from '@/lib/types'
import { UserAvatar } from './user-avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getImageUrl } from '@/lib/image-url'

interface MessageListProps {
  messages: (Message & { sender: Profile })[]
  currentUserId: string
  onDeleteMessage: (messageId: string) => void
}

function formatMessageDate(dateString: string) {
  const date = new Date(dateString)
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`
  }
  return format(date, 'MMM d, yyyy h:mm a')
}

function shouldShowHeader(
  currentMessage: Message & { sender: Profile },
  previousMessage?: Message & { sender: Profile }
) {
  if (!previousMessage) return true
  if (previousMessage.sender_id !== currentMessage.sender_id) return true
  
  const currentTime = new Date(currentMessage.created_at).getTime()
  const previousTime = new Date(previousMessage.created_at).getTime()
  const diffMinutes = (currentTime - previousTime) / (1000 * 60)
  
  return diffMinutes > 5
}

export function MessageList({
  messages,
  currentUserId,
  onDeleteMessage,
}: MessageListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground/70">
            Send a message to start the conversation!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-1">
      {messages.map((message, index) => {
        const showHeader = shouldShowHeader(message, messages[index - 1])
        const isOwn = message.sender_id === currentUserId

        return (
          <div
            key={message.id}
            className={cn(
              'group relative hover:bg-secondary/30 rounded px-2 py-0.5 -mx-2',
              showHeader && 'mt-4 pt-1'
            )}
            onMouseEnter={() => setHoveredId(message.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {showHeader && (
              <div className="flex items-center gap-3 mb-1">
                <UserAvatar
                  src={message.sender?.avatar_url}
                  fallback={message.sender?.display_name || 'User'}
                  size="sm"
                />
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-foreground">
                    {message.sender?.display_name || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatMessageDate(message.created_at)}
                  </span>
                </div>
              </div>
            )}
            <div className={cn('relative', showHeader ? 'ml-11' : 'ml-11')}>
              {!showHeader && hoveredId === message.id && (
                <span className="absolute -left-11 text-[10px] text-muted-foreground/70 top-1">
                  {format(new Date(message.created_at), 'h:mm a')}
                </span>
              )}
              {message.content && (
                <p className="text-foreground break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
              {message.image_url && (
                <div className="mt-1">
                  <img
                    src={getImageUrl(message.image_url) || ''}
                    alt="Attached image"
                    className="max-w-md max-h-80 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      const url = getImageUrl(message.image_url)
                      if (url) window.open(url, '_blank')
                    }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            {isOwn && hoveredId === message.id && (
              <div className="absolute right-2 top-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onDeleteMessage(message.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
