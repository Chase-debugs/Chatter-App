export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  status: 'online' | 'offline' | 'away' | 'dnd'
  created_at: string
  updated_at: string
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
  // Joined data
  requester?: Profile
  addressee?: Profile
}

export interface Block {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
  // Joined data
  blocked?: Profile
}

export interface Conversation {
  id: string
  name: string | null
  is_group: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined data
  members?: ConversationMember[]
  last_message?: Message
}

export interface ConversationMember {
  id: string
  conversation_id: string
  user_id: string
  joined_at: string
  last_read_at: string
  // Joined data
  profile?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  image_url: string | null
  created_at: string
  updated_at: string
  // Joined data
  sender?: Profile
}

export interface ConversationWithDetails extends Conversation {
  members: (ConversationMember & { profile: Profile })[]
  last_message?: Message & { sender: Profile }
  unread_count?: number
}
