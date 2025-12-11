import { Sidebar } from './Sidebar';
import { ChannelHeader } from './ChannelHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { MembersSidebar } from './MembersSidebar';
import { DmWindow } from './DmWindow';
import { useState } from 'react';
import { useDmStore } from '@/stores/dmStore';
import { useWebSocket } from '@/hooks/useWebSocket';

export const ChatLayout = () => {
  const [showMembers, setShowMembers] = useState(false);
  const { currentThreadId } = useDmStore();
  
  // Initialize WebSocket listeners globally for the chat layout
  useWebSocket();

  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        {currentThreadId ? (
          <DmWindow />
        ) : (
          <>
            <ChannelHeader onToggleMembers={() => setShowMembers(!showMembers)} showMembers={showMembers} />
            <MessageList />
            <MessageInput />
            <MembersSidebar isOpen={showMembers} onClose={() => setShowMembers(false)} />
            {showMembers && (
              <div
                className="fixed inset-0 z-10 bg-black/50"
                onClick={() => setShowMembers(false)}
                aria-hidden
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
