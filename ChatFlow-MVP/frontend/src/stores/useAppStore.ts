import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  status: 'online' | 'offline';
}

interface DirectMessage {
  id: string;
  conversationId: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  username: string;
}

interface AppStore {
  // Current user
  currentUser: User | null;
  
  // Presence tracking
  userStatusMap: Record<string, 'online' | 'offline'>;
  
  // Direct messages
  dmMessages: DirectMessage[];
  currentConversationId: string | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  isWebSocketConnected: boolean;

  // Actions
  setCurrentUser: (user: User) => void;
  setUserStatus: (userId: string, status: 'online' | 'offline') => void;
  setUserStatusBatch: (statusMap: Record<string, 'online' | 'offline'>) => void;
  addDMMessage: (message: DirectMessage) => void;
  setDMMessages: (messages: DirectMessage[]) => void;
  setCurrentConversation: (conversationId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setWebSocketConnected: (connected: boolean) => void;
  clearAll: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  currentUser: null,
  userStatusMap: {},
  dmMessages: [],
  currentConversationId: null,
  isLoading: false,
  error: null,
  isWebSocketConnected: false,

  // Actions
  setCurrentUser: (user) => set({ currentUser: user }),

  setUserStatus: (userId, status) =>
    set((state) => ({
      userStatusMap: { ...state.userStatusMap, [userId]: status }
    })),

  setUserStatusBatch: (statusMap) =>
    set((state) => ({
      userStatusMap: { ...state.userStatusMap, ...statusMap }
    })),

  addDMMessage: (message) =>
    set((state) => ({
      dmMessages: [...state.dmMessages, message]
    })),

  setDMMessages: (messages) => set({ dmMessages: messages }),

  setCurrentConversation: (conversationId) =>
    set({ currentConversationId: conversationId }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setWebSocketConnected: (connected) =>
    set({ isWebSocketConnected: connected }),

  clearAll: () =>
    set({
      currentUser: null,
      userStatusMap: {},
      dmMessages: [],
      currentConversationId: null,
      isLoading: false,
      error: null,
      isWebSocketConnected: false
    })
}));
