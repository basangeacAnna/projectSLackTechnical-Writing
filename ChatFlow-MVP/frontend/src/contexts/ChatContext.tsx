import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Workspace, Channel, Message } from '@/lib/mockData';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useRef } from 'react';

// Configura l'URL del Backend
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const API_URL = `${BACKEND_URL}/api`;
const SOCKET_URL = BACKEND_URL;

interface ChatContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  currentWorkspace: Workspace | null;
  currentChannel: Channel | null;
  channels: Channel[];
  messages: Message[];
  users: User[]; // Mocked for now to prevent TS errors
  usersMap: Record<string, User>;
  channelMembers: User[];
  onlineCount: number;
  userStatusMap: Record<string, User['status']>;
  socket: Socket | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setCurrentChannel: (channel: Channel) => void;
  sendMessage: (content: string) => void;
  createChannel: (name: string, description: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Workspace fittizio per ora (in futuro fetch dai real workspaces)
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>({
    id: '1',
    name: 'Default Workspace',
    owner_id: '1',
    created_at: new Date().toISOString()
  });

  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [channelMembers, setChannelMembers] = useState<User[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userStatusMap, setUserStatusMap] = useState<Record<string, User['status']>>({});
  
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const usersMapRef = useRef<Record<string, User>>({});
  const fetchingUserIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    usersMapRef.current = usersMap;
  }, [usersMap]);

  const emitStatus = (status: User['status']) => {
    if (!socket) return;
    setCurrentUser(prev => prev ? { ...prev, status } : prev);
    socket.emit('status_set', { status });
  };

  // 1. Inizializzazione Socket al login
  useEffect(() => {
    if (token && !socket) {
      console.log("Initializing socket connection...");
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token
        }
      });
      
      newSocket.on('connect', () => {
          console.log("Socket connected:", newSocket.id);
          // Ensure current user is marked online on connect
          if (currentUser?.id) {
            setUserStatusMap(prev => ({ ...prev, [currentUser.id]: 'online' }));
            newSocket.emit('status_set', { status: 'online' });
          }
      });

      newSocket.on('initial_status_list', (onlineUsers: { id: string, status: User['status'] }[]) => {
          console.log("Received initial online users list:", onlineUsers);
          const statusMap: Record<string, User['status']> = {};
          onlineUsers.forEach(u => {
              statusMap[u.id] = u.status;
          });
          setUserStatusMap(prev => ({ ...prev, ...statusMap }));
      });

      newSocket.on('receive_message', (message: Message) => {
        console.log("Received message via socket:", message);
        // Aggiungi messaggio solo se appartiene al canale corrente
        setMessages((prev) => {
            // Check if message already exists to prevent duplicates
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message];
        });
        
        if (message.user_id && !usersMapRef.current[message.user_id]) {
             const newUser: User = {
                 id: message.user_id,
                 username: message.username || 'Unknown',
                 display_name: message.display_name,
                 avatar_url: message.avatar_url,
                 status: message.status as User['status'] || 'online',
                 email: '',
                 created_at: ''
             };
             setUsersMap(prev => ({ ...prev, [message.user_id]: newUser }));
        }
      });

      newSocket.on('status_change', async ({ userId, status }: { userId: string, status: 'online' | 'offline' | 'away' | 'dnd' }) => {
        console.log("Status change received:", userId, status);
        setMessages((prev) => prev.map(msg => 
          msg.user_id === userId ? { ...msg, status } : msg
        ));
        setCurrentUser(prev => prev && prev.id === userId ? { ...prev, status } : prev);
        setUserStatusMap(prev => ({ ...prev, [userId]: status }));

        if (userId && !usersMapRef.current[userId] && (!currentUser || userId !== currentUser.id)) {
            try {
                const res = await axios.get(`${API_URL}/users/${userId}`);
                setUsersMap(prev => ({ ...prev, [userId]: res.data }));
            } catch (e) {
                console.error("Failed to fetch user details for", userId);
            }
        }
      });

      setSocket(newSocket);

      return () => {
        console.log("Closing socket connection...");
        newSocket.close();
        setSocket(null);
      };
    }
  }, [token]); // Re-run only if token changes (login/logout)

  // 2. Fetch Channels on Load/Login
  useEffect(() => {
      if (token) {
          console.log("Fetching channels...");
          fetchChannels();
          
          // Also fetch current user if missing
          if (!currentUser) {
              console.log("Fetching current user session...");
              axios.get(`${API_URL}/auth/me`, {
                  headers: { Authorization: `Bearer ${token}` }
              })
              .then(res => {
                  console.log("User session restored:", res.data);
                  setCurrentUser(res.data);
                  if (res.data?.id) {
                    setUserStatusMap(prev => ({ ...prev, [res.data.id]: (res.data.status as User['status']) || 'online' }));
                  }
              })
              .catch(err => {
                  console.error("Failed to restore session:", err);
                  // If token is invalid, logout
                  if (err.response && err.response.status === 401) {
                      logout();
                  }
              });
          }
      }
  }, [token]);

  // 3. Fetch Messages when Channel Changes
  useEffect(() => {
      if (currentChannel && token) {
          console.log("Channel changed to:", currentChannel.name);
          fetchMessages(currentChannel.id);
        fetchChannelMembers(currentChannel.id);
          
          if (socket) {
              console.log("Joining channel room:", currentChannel.id);
              socket.emit('join_channel', currentChannel.id);
          }
      }
  }, [currentChannel, token, socket]);

  const fetchChannels = async () => {
      try {
          const res = await axios.get(`${API_URL}/chat/channels`);
          setChannels(res.data);
          if (res.data.length > 0 && !currentChannel) {
              setCurrentChannel(res.data[0]);
          }
      } catch (error) {
          console.error("Failed to fetch channels", error);
      }
  };

  const fetchMessages = async (channelId: string) => {
      try {
          const res = await axios.get(`${API_URL}/chat/messages/${channelId}`);
          setMessages(res.data);
          
          setUserStatusMap(prev => {
            const updated = { ...prev } as Record<string, User['status']>;
            const newUsers: Record<string, User> = {};
            
            res.data.forEach((m: Message & { status?: User['status'], bio?: string }) => {
              if (m.user_id) {
                  if (m.status) updated[m.user_id] = m.status as User['status'];
                  
                  newUsers[m.user_id] = {
                      id: m.user_id,
                      username: m.username || 'Unknown',
                      display_name: m.display_name || '',
                      avatar_url: m.avatar_url || null,
                      bio: m.bio || '',
                      status: m.status as User['status'] || 'offline',
                      email: '', 
                      created_at: ''
                  };
              }
            });
            
            setUsersMap(prevUsers => ({ ...prevUsers, ...newUsers }));
            
            return updated;
          });
      } catch (error) {
          console.error("Failed to fetch messages", error);
      }
  };

      const fetchChannelMembers = async (channelId: string) => {
        try {
          const res = await axios.get(`${API_URL}/chat/channels/${channelId}/members`);
          const members: User[] = res.data;
          setChannelMembers(members);

          // Merge into usersMap so MembersSidebar can always see them
          setUsersMap(prev => {
            const updated = { ...prev } as Record<string, User>;
            members.forEach(m => {
              if (!updated[m.id]) {
                updated[m.id] = m;
              }
            });
            return updated;
          });

          // Seed status map from members table if not already present
          setUserStatusMap(prev => {
            const updated = { ...prev } as Record<string, User['status']>;
            members.forEach(m => {
              if (m.id && !updated[m.id]) {
                updated[m.id] = (m.status as User['status']) || 'offline';
              }
            });
            return updated;
          });
        } catch (error) {
          console.error("Failed to fetch channel members", error);
        }
      };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setCurrentUser(user);
      if (user?.id) {
        setUserStatusMap(prev => ({ ...prev, [user.id]: (user.status as User['status']) || 'online' }));
      }
      
      // Force fetch channels immediately after login
      // This helps ensure data is ready before navigation completes or shortly after
      // Although the useEffect [token] will also trigger it.
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
      try {
          const res = await axios.post(`${API_URL}/auth/register`, { username, email, password });
          const { token, user } = res.data;

          localStorage.setItem('token', token);
          setToken(token);
          setCurrentUser(user);
          return { success: true };
      } catch (error: any) {
          console.error("Registration failed", error);
          const msg = error.response?.data?.message || error.message || "Registration failed";
          return { success: false, message: msg };
      }
  };

  const logout = () => {
    localStorage.removeItem('token');
    if (socket) {
      socket.emit('status_set', { status: 'offline' });
      socket.disconnect();
    }
    setToken(null);
    setCurrentUser(null);
    setSocket(null);
    setUserStatusMap({});
  };

  // Idle / presence handling: after 5 minutes of inactivity set away; keep DND manual
  useEffect(() => {
    if (!socket || !currentUser) return;
    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    const setAway = () => {
      if (currentUser.status === 'dnd') return;
      if (currentUser.status !== 'away') emitStatus('away');
    };

    const resetTimer = () => {
      if (currentUser.status === 'dnd') return; // Do not override manual DND
      if (currentUser.status !== 'online') emitStatus('online');
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(setAway, IDLE_TIMEOUT);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [socket, currentUser]);

  const sendMessage = async (content: string) => {
    console.log("Attempting to send message:", content);
    if (!currentChannel) {
        console.error("No current channel selected");
        return;
    }
    if (!currentUser) {
        console.error("No current user");
        return;
    }
    if (!socket) {
        console.error("Socket not connected");
        return;
    }

    try {
        console.log("Sending API request to save message...");
        const res = await axios.post(`${API_URL}/chat/messages`, {
            content,
            userId: currentUser.id,
            channelId: currentChannel.id
        });

        const newMessage = res.data;
        // Attach current user's details to the message so it displays correctly immediately
        const messageWithUser = {
            ...newMessage,
            username: currentUser.username,
            display_name: currentUser.display_name,
            avatar_url: currentUser.avatar_url,
            status: currentUser.status
        };

        setUserStatusMap(prev => ({ ...prev, [currentUser.id]: (currentUser.status as User['status']) || 'online' }));

        console.log("Message saved to DB:", messageWithUser);
        
        // Emit to socket for others
        console.log("Emitting to socket:", messageWithUser);
        socket.emit('send_message', messageWithUser);

        // Add to local state
        setMessages((prev) => {
            console.log("Updating local messages state");
            return [...prev, messageWithUser];
        });
    } catch (error) {
        console.error("Failed to send message", error);
    }
  };

  const createChannel = async (name: string, description: string) => {
      try {
          const res = await axios.post(`${API_URL}/chat/channels`, { name, description });
          setChannels(prev => [...prev, res.data]);
          setCurrentChannel(res.data);
      } catch (error) {
          console.error("Failed to create channel", error);
      }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const res = await axios.put(`${API_URL}/users/me`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(res.data);
      if (res.data?.status) {
        emitStatus(res.data.status as User['status']);
      }
      if (res.data?.id && res.data?.status) {
        setUserStatusMap(prev => ({ ...prev, [res.data.id]: res.data.status as User['status'] }));
      }
    } catch (error) {
      console.error("Failed to update profile", error);
      throw error;
    }
  };

  // Ensure all users in userStatusMap are in usersMap
  useEffect(() => {
      const missingIds = Object.keys(userStatusMap).filter(id => 
        id && !usersMap[id] && !fetchingUserIds.current.has(id)
      );

      if (missingIds.length > 0) {
          console.log("Fetching missing users:", missingIds);
          missingIds.forEach(id => {
              fetchingUserIds.current.add(id);
              axios.get(`${API_URL}/users/${id}`)
                  .then(res => {
                      setUsersMap(prev => {
                          if (prev[id]) return prev;
                          return { ...prev, [id]: res.data };
                      });
                  })
                  .catch(e => {
                      console.error("Failed to fetch user", id, e);
                  })
                  .finally(() => {
                      fetchingUserIds.current.delete(id);
                  });
          });
      }
  }, [userStatusMap, usersMap]);

  // Derive online count from the same source usato dalla MembersSidebar
  // (channelMembers + currentUser) con override di userStatusMap, così
  // il numero nel header coincide con la lista nella sidebar.
  const baseStatusUsers: { id: string; status: User['status'] }[] = [
    ...channelMembers.map(m => ({ id: m.id, status: (m.status as User['status']) || 'offline' })),
  ];

  if (currentUser?.id && !baseStatusUsers.some(u => u.id === currentUser.id)) {
    baseStatusUsers.push({
      id: currentUser.id,
      status: (currentUser.status as User['status']) || 'online',
    });
  }

  const mergedStatusUsers = baseStatusUsers.map(u => ({
    id: u.id,
    status: userStatusMap[u.id] || u.status || 'offline',
  }));

  const derivedOnlineCount = mergedStatusUsers
    .map(u => u.status)
    .filter(status => status === 'online' || status === 'away' || status === 'dnd')
    .length;

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!token,
        currentWorkspace,
        currentChannel,
        channels,
        messages,
        users: Object.values(usersMap),
        usersMap,
        channelMembers,
        userStatusMap,
        onlineCount: derivedOnlineCount,
        socket,
        login,
        register,
        logout,
        setCurrentChannel,
        sendMessage,
        createChannel,
        updateProfile
      }}
    >
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