import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Workspace, Channel, Message } from '@/lib/mockData';
import { io, Socket } from 'socket.io-client';

// Configura l'URL della tua VM
const API_URL = 'http://192.168.28.128:3000/api';
const SOCKET_URL = 'http://192.168.28.128:3000';

interface ChatContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  currentWorkspace: Workspace | null;
  currentChannel: Channel | null;
  channels: Channel[];
  messages: Message[];
  users: User[]; // Mocked for now to prevent TS errors
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCurrentChannel: (channel: Channel) => void;
  sendMessage: (content: string) => void;
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
  const [socket, setSocket] = useState<Socket | null>(null);

  // 1. Inizializzazione Socket al login
  useEffect(() => {
    if (token && !socket) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('receive_message', (message: Message) => {
        // Aggiungi messaggio solo se appartiene al canale corrente
        // In una app reale, potresti voler aggiungere un badge di notifica se è un altro canale
        setMessages((prev) => {
          if (currentChannel && message.channel_id === currentChannel.id) {
            // Evita duplicati se il socket invia anche al mittente
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message];
          }
          return prev;
        });
      });

      return () => { newSocket.close(); setSocket(null); };
    }
  }, [token, currentChannel]); // Ricarica listener se cambia canale (opzionale, meglio gestire channel filter dentro)

  // 2. Carica Canali all'avvio (se loggato)
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/chat/channels`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch channels');
          return res.json();
        })
        .then(data => {
          setChannels(data);
          if (data.length > 0 && !currentChannel) {
            handleSetCurrentChannel(data[0]);
          }
        })
        .catch(err => console.error("Errore caricamento canali:", err));
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error('Login fallito');

      const data = await res.json();
      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setMessages([]);
    if (socket) socket.disconnect();
  };

  const handleSetCurrentChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    if (socket) socket.emit('join_channel', channel.id);

    // Carica messaggi del canale
    if (token) {
      fetch(`${API_URL}/chat/channels/${channel.id}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(err => console.error("Errore caricamento messaggi:", err));
    }
  };

  const sendMessage = (content: string) => {
    if (!currentUser || !currentChannel || !token) return;

    // 1. Invia al backend (per salvare nel DB)
    fetch(`${API_URL}/chat/channels/${currentChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    })
      .then(res => res.json())
      .then((savedMessage) => {
        // 2. Aggiorna UI locale subito
        setMessages(prev => [...prev, savedMessage]);

        // 3. Emetti via Socket per gli altri
        if (socket) {
          socket.emit('send_message', savedMessage);
        }
      })
      .catch(err => console.error("Errore invio messaggio:", err));
  };

  const isAuthenticated = !!token;

  return (
    <ChatContext.Provider value={{
      currentUser,
      isAuthenticated,
      currentWorkspace,
      currentChannel,
      channels,
      messages,
      users: [], // Mocked empty list
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
