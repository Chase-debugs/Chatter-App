-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  status text default 'offline',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Friendships table (bidirectional)
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(requester_id, addressee_id)
);

-- Blocks table
create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);

-- Conversations table (DMs and group chats)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  name text,
  is_group boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conversation members
create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  last_read_at timestamptz default now(),
  unique(conversation_id, user_id)
);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for better query performance
create index if not exists idx_friendships_requester on public.friendships(requester_id);
create index if not exists idx_friendships_addressee on public.friendships(addressee_id);
create index if not exists idx_blocks_blocker on public.blocks(blocker_id);
create index if not exists idx_blocks_blocked on public.blocks(blocked_id);
create index if not exists idx_conversation_members_user on public.conversation_members(user_id);
create index if not exists idx_conversation_members_conversation on public.conversation_members(conversation_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_created on public.messages(created_at desc);

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
create policy "Users can view all profiles" on public.profiles 
  for select using (true);

create policy "Users can update own profile" on public.profiles 
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles 
  for insert with check (auth.uid() = id);

-- Friendships policies
create policy "Users can view their friendships" on public.friendships 
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can send friend requests" on public.friendships 
  for insert with check (auth.uid() = requester_id);

create policy "Users can update friendships they're part of" on public.friendships 
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can delete their friendships" on public.friendships 
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Blocks policies
create policy "Users can view their blocks" on public.blocks 
  for select using (auth.uid() = blocker_id);

create policy "Users can block others" on public.blocks 
  for insert with check (auth.uid() = blocker_id);

create policy "Users can unblock" on public.blocks 
  for delete using (auth.uid() = blocker_id);

-- Conversations policies
create policy "Users can view conversations they're in" on public.conversations 
  for select using (
    exists (
      select 1 from public.conversation_members 
      where conversation_id = conversations.id 
      and user_id = auth.uid()
    )
  );

create policy "Users can create conversations" on public.conversations 
  for insert with check (auth.uid() = created_by);

create policy "Users can update conversations they're in" on public.conversations 
  for update using (
    exists (
      select 1 from public.conversation_members 
      where conversation_id = conversations.id 
      and user_id = auth.uid()
    )
  );

-- Conversation members policies
create policy "Users can view members of their conversations" on public.conversation_members 
  for select using (
    exists (
      select 1 from public.conversation_members cm 
      where cm.conversation_id = conversation_members.conversation_id 
      and cm.user_id = auth.uid()
    )
  );

create policy "Conversation creator can add members" on public.conversation_members 
  for insert with check (
    exists (
      select 1 from public.conversations 
      where id = conversation_id 
      and created_by = auth.uid()
    ) or user_id = auth.uid()
  );

create policy "Users can leave conversations" on public.conversation_members 
  for delete using (user_id = auth.uid());

-- Messages policies
create policy "Users can view messages in their conversations" on public.messages 
  for select using (
    exists (
      select 1 from public.conversation_members 
      where conversation_id = messages.conversation_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can send messages to their conversations" on public.messages 
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversation_members 
      where conversation_id = messages.conversation_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can update their own messages" on public.messages 
  for update using (auth.uid() = sender_id);

create policy "Users can delete their own messages" on public.messages 
  for delete using (auth.uid() = sender_id);

-- Enable realtime for messages and conversation_members
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversation_members;
alter publication supabase_realtime add table public.friendships;
