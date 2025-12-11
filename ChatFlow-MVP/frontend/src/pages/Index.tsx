import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { ChatLayout } from '@/components/chat/ChatLayout';

const Index = () => {
  const { isAuthenticated, currentChannel, channels } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  // Show loading state if channels are being fetched but none selected yet
  if (!currentChannel && channels.length === 0) {
      return <div className="h-screen flex items-center justify-center">Loading channels...</div>;
  }

  return <ChatLayout />;
};

export default Index;
