import { useState, KeyboardEvent, useRef } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import EmojiPickerPopup from './EmojiPickerPopup';

export const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, currentChannel } = useChat();

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    
    sendMessage(trimmed);
    setMessage('');
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmojiAtCursor = (emoji: { native: string }) => {
    if (!textareaRef.current) return;

    const inputElement = textareaRef.current;
    const cursorStart = inputElement.selectionStart || 0;
    const cursorEnd = inputElement.selectionEnd || 0;

    const beforeCursor = message.substring(0, cursorStart);
    const afterCursor = message.substring(cursorEnd);
    const newText = beforeCursor + emoji.native + afterCursor;

    setMessage(newText);

    setTimeout(() => {
      inputElement.focus();
      const newCursorPos = cursorStart + emoji.native.length;
      inputElement.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  if (!currentChannel) return null;

  return (
    <div className="px-5 pb-5 relative">
      <div className="bg-chat-message rounded-lg border border-border relative">
        <div className="flex items-end gap-2 p-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${currentChannel.name}`}
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground min-h-[36px] max-h-[200px] py-2"
            rows={1}
          />
          
          <div className="relative">
             {showEmojiPicker && (
                <EmojiPickerPopup
                  onEmojiSelect={insertEmojiAtCursor}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0 ${showEmojiPicker ? 'text-foreground bg-muted' : ''}`}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-5 h-5" />
              </Button>
          </div>
          
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
