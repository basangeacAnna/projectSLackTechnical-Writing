import { useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useDmStore } from '@/stores/dmStore';
import { useAppStore } from '@/stores/useAppStore';

export const useWebSocket = () => {
  const { socket, currentUser } = useChat();
  const { 
    addMessage, 
    setError, 
    removeMessageFromStore, 
    removeThreadFromStore,
    addTypingUser, 
    removeTypingUser,
    currentThreadId,
    dmThreads
  } = useDmStore();
  
  const { setUserStatus, setUserStatusBatch } = useAppStore();

  // Presence Logic
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Request initial list
    socket.emit('get_online_users');

    const handleStatusChange = (data: any) => {
        console.log(`📊 User ${data.userId} is ${data.status}`);
        setUserStatus(data.userId, data.status);
    };

    const handleOnlineUsers = (users: any[]) => {
        const statusMap = users.reduce(
            (acc: Record<string, 'online' | 'offline'>, user: any) => {
                acc[user.id] = user.status;
                return acc;
            },
            {}
        );
        setUserStatusBatch(statusMap);
    };

    socket.on('status_change', handleStatusChange);
    socket.on('initial_status_list', handleOnlineUsers);

    return () => {
        socket.off('status_change', handleStatusChange);
        socket.off('initial_status_list', handleOnlineUsers);
    };
  }, [socket, currentUser, setUserStatus, setUserStatusBatch]);

  // DM Logic
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      console.log('📨 New DM received:', data);
      // Backend sends { threadId, message }
      if (data.message) {
          // Inject threadId into message so store knows where it belongs
          const messageWithThread = { ...data.message, thread_id: data.threadId };
          addMessage(messageWithThread);
      }
    };

    const handleTyping = (data: any) => {
        // Only process if not from us
        if (data.userId !== currentUser?.id) {
            // Try to find username
            const thread = dmThreads.find(t => t.threadId === data.threadId);
            const username = thread?.otherUser?.id === data.userId 
                ? (thread.otherUser.display_name || thread.otherUser.username)
                : "Someone";
            
            addTypingUser(data.threadId, data.userId, username); 
        }
    };

    const handleStopTyping = (data: any) => {
        removeTypingUser(data.threadId, data.userId);
    };

    const handleMessageDeleted = (data: any) => {
        removeMessageFromStore(data.messageId);
    };

    const handleThreadDeleted = (data: any) => {
        console.log('🗑️ Thread deleted:', data.threadId);
        removeThreadFromStore(data.threadId);
    };

    const handleError = (data: any) => {
      console.error('❌ DM Error:', data.error);
      setError(data.error);
    };

    socket.on('dm:new_message', handleNewMessage);
    socket.on('dm:typing', handleTyping);
    socket.on('dm:stop_typing', handleStopTyping);
    socket.on('dm:message_deleted', handleMessageDeleted);
    socket.on('dm:thread_deleted', handleThreadDeleted);
    socket.on('dm_error', handleError);

    return () => {
      socket.off('dm:new_message', handleNewMessage);
      socket.off('dm:typing', handleTyping);
      socket.off('dm:stop_typing', handleStopTyping);
      socket.off('dm:message_deleted', handleMessageDeleted);
      socket.off('dm:thread_deleted', handleThreadDeleted);
      socket.off('dm_error', handleError);
    };
  }, [socket, currentThreadId, currentUser, dmThreads, addMessage, setError, removeMessageFromStore, addTypingUser, removeTypingUser]);

  const joinDM = (threadId: string) => {
    if (socket) {
      socket.emit('dm:join_thread', { threadId });
    }
  };

  const leaveDM = (threadId: string) => {
    if (socket) {
      socket.emit('dm:leave_thread', { threadId });
    }
  };

  const sendTyping = (threadId: string) => {
      if (socket) {
          socket.emit('dm:typing', { threadId });
      }
  };

  const stopTyping = (threadId: string) => {
      if (socket) {
          socket.emit('dm:stop_typing', { threadId });
      }
  };

  return {
    socket,
    joinDM,
    leaveDM,
    sendTyping,
    stopTyping,
    isConnected: !!socket?.connected
  };
};
