import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  User, Workspace, Channel, Message,
  mockUsers, mockWorkspaces, mockChannels, mockMessages,
  getChannelsByWorkspace, getMessagesByChannel, getUserById
} from '@/lib/mockData';

interface ChatContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  currentWorkspace: Workspace | null;
  currentChannel: Channel | null;
  channels: Channel[];
  messages: Message[];
  users: User[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setCurrentChannel: (channel: Channel) => void;
  sendMessage: (content: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const isAuthenticated = currentUser !== null;

  const login = (email: string, password: string): boolean => {
    // Mock login - find user by email
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      // Auto-select first workspace
      const workspace = mockWorkspaces[0];
      setCurrentWorkspace(workspace);
      // Auto-select first channel
      const channels = getChannelsByWorkspace(workspace.id);
      if (channels.length > 0) {
        setCurrentChannel(channels[0]);
        setMessages(getMessagesByChannel(channels[0].id));
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentWorkspace(null);
    setCurrentChannel(null);
    setMessages([]);
  };

  const handleSetCurrentChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    setMessages(getMessagesByChannel(channel.id));
  };

  const sendMessage = (content: string) => {
    if (!currentUser || !currentChannel) return;
    
    const newMessage: Message = {
      id: `m${Date.now()}`,
      channel_id: currentChannel.id,
      user_id: currentUser.id,
      content,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const channels = currentWorkspace 
    ? getChannelsByWorkspace(currentWorkspace.id) 
    : [];

  return (
    <ChatContext.Provider value={{
      currentUser,
      isAuthenticated,
      currentWorkspace,
      currentChannel,
      channels,
      messages,
      users: mockUsers,
      login,
      logout,
      setCurrentChannel: handleSetCurrentChannel,
      sendMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
