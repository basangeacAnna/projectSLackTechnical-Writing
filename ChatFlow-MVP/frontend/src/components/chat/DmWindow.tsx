import React, { useEffect, useRef, useState } from 'react';
import { useDmStore } from '@/stores/dmStore';
import { useAppStore } from '@/stores/useAppStore';
import { useChat } from '@/contexts/ChatContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserAvatar } from './UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Phone, Video, MoreVertical, MessageSquare, Smile } from 'lucide-react';
import { format } from 'date-fns';
import EmojiPickerPopup from './EmojiPickerPopup';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Trash2 } from 'lucide-react';

export const DmWindow = () => {
  const { 
    currentThreadId, 
    dmThreads, 
    currentMessages, 
    fetchMessages, 
    sendMessage, 
    typingUsers, 
    markAsRead,
    deleteMessage
  } = useDmStore();
  
  const { userStatusMap } = useAppStore();
  
  // Debug log
  // console.log('DmWindow userStatusMap:', userStatusMap);
  
  const { currentUser } = useChat();
  const { joinDM, leaveDM, sendTyping, stopTyping, isConnected } = useWebSocket();
  
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentThread = dmThreads.find(t => t.threadId === currentThreadId);

  const insertEmojiAtCursor = (emoji: { native: string }) => {
    if (!inputRef.current) return;

    const inputElement = inputRef.current;
    const cursorStart = inputElement.selectionStart || 0;
    const cursorEnd = inputElement.selectionEnd || 0;

    const beforeCursor = messageInput.substring(0, cursorStart);
    const afterCursor = messageInput.substring(cursorEnd);
    const newText = beforeCursor + emoji.native + afterCursor;

    setMessageInput(newText);

    setTimeout(() => {
      inputElement.focus();
      const newCursorPos = cursorStart + emoji.native.length;
      inputElement.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  useEffect(() => {
    if (!currentThreadId) return;
    
    fetchMessages(currentThreadId);
    joinDM(currentThreadId);
    
    return () => {
      leaveDM(currentThreadId);
    };
  }, [currentThreadId]); // Removed socket dependency as hook handles it

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark as read logic
    if (currentMessages.length > 0 && currentThreadId) {
        const lastMsg = currentMessages[currentMessages.length - 1];
        if (lastMsg.sender_id !== currentUser?.id) {
             markAsRead(currentThreadId, lastMsg.id);
        }
    }
  }, [currentMessages, currentThreadId, currentUser]);

  // WebSocket listeners are now handled by useWebSocket hook

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentThreadId) return;

    const msg = messageInput;
    setMessageInput('');
    
    stopTyping(currentThreadId);
    setIsTyping(false);

    await sendMessage(currentThreadId, msg);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (!currentThreadId) return;

    if (!isTyping) {
      setIsTyping(true);
      sendTyping(currentThreadId);
    }

    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(currentThreadId);
    }, 2000);
  };

  if (!currentThreadId || !currentThread) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground bg-background">
        <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const otherUser = currentThread.otherUser;
  const status = userStatusMap[otherUser.id] || otherUser.status || 'offline';

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <UserAvatar 
            userId={otherUser.id}
            avatarUrl={otherUser.avatar_url} 
            fallbackName={otherUser.username}
            status={status}
            className="h-8 w-8"
            showStatus={false}
          />
          <div>
            <h2 className="font-semibold text-sm">{otherUser.display_name || otherUser.username}</h2>
            <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                    status === 'online' ? 'bg-green-500' : 
                    status === 'dnd' ? 'bg-red-500' : 
                    status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
                <span className="text-xs text-muted-foreground capitalize">{status}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Phone className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon"><Video className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {currentMessages.map((msg, index) => {
            const isMe = msg.sender_id === currentUser?.id;
            const showAvatar = !isMe && (index === 0 || currentMessages[index - 1].sender_id !== msg.sender_id);
            
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                    <div className="w-8 flex-shrink-0">
                        {showAvatar ? (
                            <UserAvatar 
                                userId={msg.sender_id}
                                avatarUrl={msg.avatar_url}
                                fallbackName={msg.username || '?'}
                                className="w-8 h-8"
                                showStatus={false}
                            />
                        ) : <div className="w-8" />}
                    </div>
                )}
                
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && showAvatar && (
                        <span className="text-xs text-muted-foreground ml-1 mb-1">{msg.display_name || msg.username}</span>
                    )}
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <div
                                className={`px-4 py-2 rounded-2xl text-sm ${
                                isMe
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-muted text-foreground rounded-tl-none'
                                }`}
                            >
                                {msg.content}
                            </div>
                        </ContextMenuTrigger>
                        {isMe && (
                            <ContextMenuContent>
                                <ContextMenuItem 
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => deleteMessage(currentThreadId!, msg.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Message
                                </ContextMenuItem>
                            </ContextMenuContent>
                        )}
                    </ContextMenu>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                </div>
              </div>
            );
          })}
          
          {/* Typing indicator */}
          {typingUsers[currentThreadId]?.length > 0 && (
            <div className="text-xs text-muted-foreground ml-12 animate-pulse">
              {typingUsers[currentThreadId].length === 1 
                ? `${typingUsers[currentThreadId][0].username || 'Someone'} is typing...`
                : 'Multiple people are typing...'}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex gap-2 relative">
           {showEmojiPicker && (
                <EmojiPickerPopup
                  onEmojiSelect={insertEmojiAtCursor}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
          <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={messageInput}
                onChange={handleInputChange}
                placeholder={`Message ${otherUser.display_name || otherUser.username}...`}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-5 h-5" />
              </Button>
          </div>
          <Button type="submit" size="icon" disabled={!messageInput.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
