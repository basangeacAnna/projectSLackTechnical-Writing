import { useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { format, isToday, isYesterday } from 'date-fns';
import { UserAvatar } from './UserAvatar';

const formatMessageDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, "'Today at' h:mm a");
  }
  if (isYesterday(date)) {
    return format(date, "'Yesterday at' h:mm a");
  }
  return format(date, "MMM d, yyyy 'at' h:mm a");
};

const MessageItem = ({ 
  message, 
  showHeader 
}: { 
  message: { 
    id: string; 
    user_id: string; 
    content: string; 
    created_at: string; 
    username?: string;
    display_name?: string;
    avatar_url?: string | null;
  };
  showHeader: boolean;
}) => {
  // Use display_name if available, otherwise username, otherwise "Unknown User"
  const displayName = message.display_name || message.username || "Unknown User";
  
  return (
    <div className="group px-5 py-0.5 hover:bg-chat-message-hover transition-colors animate-fade-in">
      {showHeader ? (
        <div className="flex items-start gap-3 pt-2">
          <UserAvatar 
            avatarUrl={message.avatar_url} 
            fallbackName={displayName} 
            status={message.status}
            className="w-9 h-9 mt-0.5"
            showStatus={!!message.status}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-foreground text-sm">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatMessageDate(message.created_at)}
              </span>
            </div>
            <p className="text-foreground text-sm leading-relaxed break-words">
              {message.content}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="w-9 flex-shrink-0 flex justify-center">
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pt-1">
              {format(new Date(message.created_at), 'h:mm')}
            </span>
          </div>
          <p className="text-foreground text-sm leading-relaxed break-words min-w-0 flex-1">
            {message.content}
          </p>
        </div>
      )}
    </div>
  );
};

export const MessageList = () => {
  const { messages, currentChannel } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a channel to start chatting
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <span className="text-3xl">#</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Welcome to #{currentChannel.name}
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          This is the start of the #{currentChannel.name} channel. Send a message to get the conversation started!
        </p>
      </div>
    );
  }

  // Group messages by user (consecutive messages from same user)
  const shouldShowHeader = (index: number) => {
    if (index === 0) return true;
    const currentMsg = messages[index];
    const prevMsg = messages[index - 1];
    
    // Show header if different user or more than 5 minutes apart
    if (currentMsg.user_id !== prevMsg.user_id) return true;
    
    const timeDiff = new Date(currentMsg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
    return timeDiff > 5 * 60 * 1000; // 5 minutes
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="py-4">
        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            showHeader={shouldShowHeader(index)}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
