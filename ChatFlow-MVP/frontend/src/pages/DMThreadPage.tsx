import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDmStore } from '@/stores/dmStore';
import { DmWindow } from '@/components/chat/DmWindow';

export const DMThreadPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { setCurrentThreadId, dmThreads, fetchDmThreads } = useDmStore();

  useEffect(() => {
    if (!threadId) {
      navigate('/app/direct-messages/new');
      return;
    }

    // Ensure threads are loaded so we can validate the threadId or just set it
    if (dmThreads.length === 0) {
        fetchDmThreads();
    }

    setCurrentThreadId(threadId);
  }, [threadId, setCurrentThreadId, fetchDmThreads, navigate, dmThreads.length]);

  // We don't strictly need to find the thread here if DmWindow handles it, 
  // but it's good to know if it exists.
  // For now, we trust DmWindow to handle the display.

  return (
    <div className="h-full w-full flex flex-col">
      <DmWindow />
    </div>
  );
};
