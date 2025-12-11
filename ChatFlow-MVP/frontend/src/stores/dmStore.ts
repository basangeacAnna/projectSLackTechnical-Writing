import { create } from 'zustand';
import axios from 'axios';

// Configure axios base URL
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

// Add interceptor for token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  status?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  thread_id?: string;
}

interface Thread {
  threadId: string;
  otherUser: User;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface DmState {
  dmThreads: Thread[];
  currentThreadId: string | null;
  currentMessages: Message[];
  messages: Record<string, Message[]>; // Cache for all threads
  typingUsers: Record<string, { userId: string; username: string }[]>;
  isLoadingMessages: boolean;
  error: string | null;

  setDmThreads: (threads: Thread[]) => void;
  setCurrentThreadId: (threadId: string | null) => void;
  addMessage: (message: Message) => void;
  updateThreadLastMessage: (threadId: string, message: Message) => void;
  addTypingUser: (threadId: string, userId: string, username: string) => void;
  removeTypingUser: (threadId: string, userId: string) => void;
  deleteMessage: (threadId: string, messageId: string) => Promise<void>;
  removeMessageFromStore: (messageId: string) => void;
  removeThreadFromStore: (threadId: string) => void;
  hideThread: (threadId: string) => void; // Alias for removeThreadFromStore
  unhideThread: (threadId: string, newMessage: Message) => void; // Logic to restore thread
  deleteThreadApi: (threadId: string) => Promise<boolean>; // Delete via API
  setError: (error: string | null) => void;
  
  fetchDmThreads: () => Promise<void>;
  fetchMessages: (threadId: string) => Promise<void>;
  sendMessage: (threadId: string, content: string) => Promise<void>;
  markAsRead: (threadId: string, lastReadMessageId: string) => Promise<void>;
  startDm: (targetUserId: string) => Promise<string | null>;
}

export const useDmStore = create<DmState>((set, get) => ({
  dmThreads: [],
  currentThreadId: null,
  currentMessages: [],
  messages: {},
  typingUsers: {},
  isLoadingMessages: false,
  error: null,

  setDmThreads: (threads) => set({ dmThreads: threads }),
  setCurrentThreadId: (threadId) => {
      const state = get();
      set({ 
          currentThreadId: threadId,
          // Load from cache if available, otherwise empty (fetchMessages will fill it)
          currentMessages: threadId ? (state.messages[threadId] || []) : []
      });
  },
  setError: (error) => set({ error }),
  
  addMessage: (message) => {
    const state = get();
    const targetThreadId = message.thread_id || state.currentThreadId;
    
    if (!targetThreadId) return;

    // 1. Update Messages Cache
    const currentThreadMessages = state.messages[targetThreadId] || [];
    // Dedup
    if (!currentThreadMessages.some(m => m.id === message.id)) {
        const newMessages = [...currentThreadMessages, message];
        
        set((state) => ({
            messages: { ...state.messages, [targetThreadId]: newMessages },
            // Sync currentMessages if this is the active thread
            currentMessages: state.currentThreadId === targetThreadId ? newMessages : state.currentMessages
        }));
    }
    
    // 2. Update Thread List (Preview & Visibility)
    const threadExists = state.dmThreads.some(t => t.threadId === targetThreadId);
    if (threadExists) {
        get().updateThreadLastMessage(targetThreadId, message);
    } else {
        // Thread might be hidden or new, fetch list to sync (Unhide logic)
        get().fetchDmThreads();
    }
  },

  updateThreadLastMessage: (threadId, message) =>
    set((state) => ({
      dmThreads: state.dmThreads.map(t =>
        t.threadId === threadId
          ? { ...t, lastMessage: message.content, lastMessageAt: message.created_at }
          : t
      ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
    })),

  addTypingUser: (threadId, userId, username) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [threadId]: [...(state.typingUsers[threadId] || []).filter(u => u.userId !== userId), { userId, username }]
      }
    })),

  removeTypingUser: (threadId, userId) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [threadId]: (state.typingUsers[threadId] || []).filter(u => u.userId !== userId)
      }
    })),

  fetchDmThreads: async () => {
    try {
      const res = await api.get('/dm');
      set({ dmThreads: res.data });
    } catch (error) {
      console.error('fetchDmThreads error:', error);
    }
  },

  fetchMessages: async (threadId) => {
    // Optimistic load from cache
    const cached = get().messages[threadId];
    if (cached) {
        set({ currentMessages: cached, isLoadingMessages: false });
    } else {
        set({ isLoadingMessages: true, currentMessages: [] });
    }

    try {
      const res = await api.get(`/dm/${threadId}/messages`);
      set(state => ({ 
          messages: { ...state.messages, [threadId]: res.data },
          currentMessages: res.data, 
          isLoadingMessages: false 
      }));
    } catch (error) {
      console.error('fetchMessages error:', error);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (threadId, content) => {
    try {
      const res = await api.post(`/dm/${threadId}/messages`, { content });
      const message = res.data;
      get().addMessage({ ...message, thread_id: threadId }); 
    } catch (error) {
      console.error('sendMessage error:', error);
    }
  },

  markAsRead: async (threadId, lastReadMessageId) => {
    try {
      await api.put(`/dm/${threadId}/read`, { lastReadMessageId });
    } catch (error) {
      console.error('markAsRead error:', error);
    }
  },

  startDm: async (targetUserId) => {
    try {
      const res = await api.post('/dm/start', { targetUserId });
      const { threadId } = res.data;
      await get().fetchDmThreads();
      return threadId;
    } catch (error) {
      console.error('startDm error:', error);
      return null;
    }
  },

  deleteMessage: async (threadId, messageId) => {
    try {
        await api.delete(`/dm/${threadId}/messages/${messageId}`);
        get().removeMessageFromStore(messageId);
    } catch (error) {
        console.error('deleteMessage error:', error);
    }
  },

  removeMessageFromStore: (messageId) => {
      set((state) => {
          // Remove from currentMessages
          const newCurrentMessages = state.currentMessages.filter(m => m.id !== messageId);
          
          // Remove from messages cache (need to find which thread it belongs to, or iterate all)
          // Optimization: if we know the threadId, it's better. But here we might not.
          // We'll iterate the cache.
          const newMessages = { ...state.messages };
          Object.keys(newMessages).forEach(tid => {
              newMessages[tid] = newMessages[tid].filter(m => m.id !== messageId);
          });

          return {
              currentMessages: newCurrentMessages,
              messages: newMessages
          };
      });
  },

  removeThreadFromStore: (threadId) => {
      set((state) => ({
          dmThreads: state.dmThreads.filter(t => t.threadId !== threadId),
          currentThreadId: state.currentThreadId === threadId ? null : state.currentThreadId,
          currentMessages: state.currentThreadId === threadId ? [] : state.currentMessages
      }));
  },

  hideThread: (threadId) => get().removeThreadFromStore(threadId),
  
  unhideThread: (threadId, newMessage) => get().addMessage(newMessage), // addMessage handles unhiding via fetch

  deleteThreadApi: async (threadId) => {
    try {
      await api.delete(`/dm/${threadId}`);
      get().hideThread(threadId);
      return true;
    } catch (error) {
      console.error('deleteThreadApi error:', error);
      return false;
    }
  }
}));
