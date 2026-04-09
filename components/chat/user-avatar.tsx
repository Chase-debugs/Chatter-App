'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getImageUrl } from '@/lib/image-url'
import { Users } from 'lucide-react'

interface UserAvatarProps {
  src?: string | null
  fallback: string
  size?: 'sm' | 'md' | 'lg'
  status?: 'online' | 'offline' | 'away' | 'dnd'
  isGroup?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-20 h-20',
}

const statusClasses = {
  online: 'bg-accent',
  offline: 'bg-muted-foreground',
  away: 'bg-yellow-500',
  dnd: 'bg-destructive',
}

export function UserAvatar({
  src,
  fallback,
  size = 'md',
  status,
  isGroup,
  className,
}: UserAvatarProps) {
  const initials = fallback
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={cn('relative', className)}>
      <Avatar className={cn(sizeClasses[size], 'border-2 border-background')}>
        {src ? (
          <AvatarImage src={getImageUrl(src) || ''} alt={fallback} />
        ) : null}
        <AvatarFallback className={cn(
          'bg-primary text-primary-foreground font-medium',
          size === 'sm' && 'text-xs',
          size === 'lg' && 'text-2xl'
        )}>
          {isGroup ? (
            <Users className={cn(
              size === 'sm' && 'w-4 h-4',
              size === 'md' && 'w-5 h-5',
              size === 'lg' && 'w-10 h-10'
            )} />
          ) : (
            initials
          )}
        </AvatarFallback>
      </Avatar>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            statusClasses[status],
            size === 'sm' && 'w-2.5 h-2.5',
            size === 'md' && 'w-3 h-3',
            size === 'lg' && 'w-5 h-5'
          )}
        />
      )}
    </div>
  )
}
