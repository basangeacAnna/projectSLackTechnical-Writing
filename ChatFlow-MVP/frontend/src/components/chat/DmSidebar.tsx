import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDmStore } from '@/stores/dmStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/contexts/ChatContext';

export const DmSidebar = () => {
  const navigate = useNavigate();
  const { dmThreads, fetchDmThreads, setCurrentThreadId, currentThreadId } = useDmStore();
  const { currentUser } = useChat();

  useEffect(() => {
    fetchDmThreads();
  }, []);

  const handleNewMessage = () => {
    navigate('/app/direct-messages/new');
  };

  return (
    <div className="w-60 flex flex-col border-r bg-muted/10 h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Direct Messages
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={handleNewMessage}
          title="Start a new conversation"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {dmThreads.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center p-4">No conversations yet</p>
          ) : (
            dmThreads.map((thread) => (
              <div
                key={thread.threadId}
                onClick={() => {
                  setCurrentThreadId(thread.threadId);
                  navigate(`/app/direct-messages/${thread.threadId}`);
                }}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                  currentThreadId === thread.threadId 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                )}
              >
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={thread.otherUser.avatar_url || undefined} />
                    <AvatarFallback>{thread.otherUser.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {/* Status indicator could go here */}
                  <span className={cn(
                    "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background",
                    thread.otherUser.status === 'online' ? "bg-green-500" :
                    thread.otherUser.status === 'dnd' ? "bg-red-500" :
                    thread.otherUser.status === 'away' ? "bg-yellow-500" : "bg-gray-500"
                  )} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm truncate">
                      {thread.otherUser.display_name || thread.otherUser.username}
                    </span>
                    {thread.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {thread.lastMessage}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
