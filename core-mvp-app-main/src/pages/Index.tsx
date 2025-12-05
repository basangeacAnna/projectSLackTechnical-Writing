import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { ChatLayout } from '@/components/chat/ChatLayout';

const Index = () => {
  const { isAuthenticated } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return <ChatLayout />;
};

export default Index;
