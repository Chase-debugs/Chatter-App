'use client'

import { UserAvatar } from './user-avatar'
import { Users } from 'lucide-react'
import type { ConversationMember, Profile } from '@/lib/types'

interface ConversationHeaderProps {
  name: string
  avatarUrl?: string | null
  isGroup: boolean
  memberCount: number
  members?: (ConversationMember & { profile: Profile })[]
}

export function ConversationHeader({
  name,
  avatarUrl,
  isGroup,
  memberCount,
  members,
}: ConversationHeaderProps) {
  return (
    <div className="h-14 px-4 flex items-center gap-3 border-b border-border bg-background">
      <UserAvatar
        src={avatarUrl}
        fallback={name}
        size="sm"
        isGroup={isGroup}
      />
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-foreground truncate">{name}</h2>
        {isGroup && members && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {memberCount} members
          </p>
        )}
      </div>
    </div>
  )
}
