import { useState, KeyboardEvent } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';

export const MessageInput = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, currentChannel } = useChat();

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    
    sendMessage(trimmed);
    setMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentChannel) return null;

  return (
    <div className="px-5 pb-5">
      <div className="bg-chat-message rounded-lg border border-border">
        <div className="flex items-end gap-2 p-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${currentChannel.name}`}
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground min-h-[36px] max-h-[200px] py-2"
            rows={1}
          />
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            size="icon"
            className="h-8 w-8 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs font-mono">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
};
