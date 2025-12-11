// Mock data matching PostgreSQL schema from manual_db_setup.md

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio?: string;
  status: 'online' | 'offline' | 'away' | 'dnd';
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  creator_id: string;
  is_private: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
  display_name?: string;
  avatar_url?: string | null;
  bio?: string;
  status?: 'online' | 'offline' | 'away' | 'dnd';
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'u1',
    email: 'alice@chatflow.local',
    username: 'alice',
    display_name: 'Alice Developer',
    avatar_url: null,
    status: 'online',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'u2',
    email: 'bob@chatflow.local',
    username: 'bob',
    display_name: 'Bob Backend',
    avatar_url: null,
    status: 'online',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'u3',
    email: 'charlie@chatflow.local',
    username: 'charlie',
    display_name: 'Charlie Frontend',
    avatar_url: null,
    status: 'away',
    created_at: '2024-01-01T10:00:00Z'
  }
];

// Mock Workspaces
export const mockWorkspaces: Workspace[] = [
  {
    id: 'w1',
    name: 'ChatFlow MVP',
    owner_id: 'u1',
    created_at: '2024-01-01T10:00:00Z'
  }
];

// Mock Channels
export const mockChannels: Channel[] = [
  {
    id: 'c1',
    workspace_id: 'w1',
    name: 'general',
    creator_id: 'u1',
    is_private: false,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'c2',
    workspace_id: 'w1',
    name: 'development',
    creator_id: 'u1',
    is_private: false,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'c3',
    workspace_id: 'w1',
    name: 'random',
    creator_id: 'u2',
    is_private: false,
    created_at: '2024-01-01T10:00:00Z'
  }
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: 'm1',
    channel_id: 'c1',
    user_id: 'u1',
    content: 'Welcome to ChatFlow MVP! 🚀',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'm2',
    channel_id: 'c1',
    user_id: 'u2',
    content: 'Hey everyone! The backend is almost ready.',
    created_at: '2024-01-01T10:05:00Z'
  },
  {
    id: 'm3',
    channel_id: 'c1',
    user_id: 'u3',
    content: 'Nice! I just finished the login component.',
    created_at: '2024-01-01T10:10:00Z'
  },
  {
    id: 'm4',
    channel_id: 'c2',
    user_id: 'u1',
    content: 'Let\'s discuss the API structure here.',
    created_at: '2024-01-01T11:00:00Z'
  },
  {
    id: 'm5',
    channel_id: 'c2',
    user_id: 'u2',
    content: 'I suggest using REST for MVP, WebSocket for real-time later.',
    created_at: '2024-01-01T11:05:00Z'
  }
];

// Helper functions
export const getUserById = (id: string): User | undefined => 
  mockUsers.find(u => u.id === id);

export const getChannelsByWorkspace = (workspaceId: string): Channel[] =>
  mockChannels.filter(c => c.workspace_id === workspaceId);

export const getMessagesByChannel = (channelId: string): Message[] =>
  mockMessages.filter(m => m.channel_id === channelId);
