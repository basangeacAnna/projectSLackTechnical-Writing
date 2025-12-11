import { Hash, Lock, LogOut, ChevronDown, Plus, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { useDmStore } from '@/stores/dmStore';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { EditProfileDialog } from './EditProfileDialog';
import { UserAvatar } from './UserAvatar';
import { DMListItem } from './DMListItem';

export const Sidebar = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    currentWorkspace, 
    currentChannel, 
    channels, 
    setCurrentChannel, 
    logout,
    createChannel,
    usersMap
  } = useChat();

  const { 
    dmThreads, 
    fetchDmThreads, 
    setCurrentThreadId, 
    currentThreadId, 
    startDm,
    hideThread,
    deleteThreadApi
  } = useDmStore();

  const { userStatusMap } = useAppStore();

  // Force re-render when userStatusMap changes
  // (Zustand should handle this automatically, but ensuring we are subscribed)
  // console.log('Sidebar userStatusMap:', userStatusMap);

  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);
  const [isDmDialogOpen, setIsDmDialogOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
        fetchDmThreads();
    }
  }, [currentUser]);

  if (!currentUser) {
    return <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full p-4 text-sidebar-foreground">Loading...</div>;
  }

  const displayName = currentUser.display_name || currentUser.username || "User";

  const handleCreateChannel = (e: React.MouseEvent) => {
      e.stopPropagation();
      const name = prompt("Enter channel name:");
      if (name) {
          createChannel(name, "New channel");
      }
  };

  const handleChannelClick = (channel: any) => {
      setCurrentChannel(channel);
      setCurrentThreadId(null);
      navigate('/');
  };

  const handleDmClick = (threadId: string) => {
      navigate(`/app/direct-messages/${threadId}`);
  };

  const handleDeleteConversation = async (threadId: string) => {
    const success = await deleteThreadApi(threadId);

    if (success) {
      if (currentThreadId === threadId) {
        navigate('/');
        setCurrentThreadId(null);
      }
    } else {
      console.error('Failed to delete conversation');
    }
  };

  const handleStartDm = async (targetUserId: string) => {
    const threadId = await startDm(targetUserId);
    if (threadId) {
      handleDmClick(threadId);
      setIsDmDialogOpen(false);
    }
  };

  const potentialDmUsers = Object.values(usersMap).filter(u => u.id !== currentUser?.id);

  if (!currentWorkspace || !currentUser) return null;

  return (
    <aside className="w-64 bg-sidebar flex flex-col border-r border-sidebar-border h-full">
      {/* Workspace Header */}
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="font-semibold text-foreground truncate">
          {currentWorkspace.name}
        </h1>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        <Collapsible open={channelsOpen} onOpenChange={setChannelsOpen}>
          <CollapsibleTrigger className="w-full px-4 py-1.5 flex items-center justify-between text-sidebar-foreground hover:text-foreground transition-colors group">
            <div className="flex items-center gap-1">
              <ChevronDown className={cn(
                "w-3 h-3 transition-transform",
                !channelsOpen && "-rotate-90"
              )} />
              <span className="text-sm font-medium">Channels</span>
            </div>
            <Plus 
                className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                onClick={handleCreateChannel}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel)}
                  className={cn(
                    "w-full px-4 py-1.5 flex items-center gap-2 text-sm transition-colors",
                    "hover:bg-chat-hover",
                    currentChannel?.id === channel.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground"
                  )}
                >
                  {channel.is_private ? (
                    <Lock className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <Hash className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Direct Messages Section */}
        <Collapsible open={dmsOpen} onOpenChange={setDmsOpen} className="mt-4">
          <CollapsibleTrigger className="w-full px-4 py-1.5 flex items-center justify-between text-sidebar-foreground hover:text-foreground transition-colors group">
            <div className="flex items-center gap-1">
              <ChevronDown className={cn(
                "w-3 h-3 transition-transform",
                !dmsOpen && "-rotate-90"
              )} />
              <span className="text-sm font-medium">Direct Messages</span>
            </div>
            
            <Plus 
                className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    navigate('/app/direct-messages/new'); 
                }}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1">
              {dmThreads.map(thread => {
                const status = userStatusMap[thread.otherUser.id] || thread.otherUser.status || 'offline';
                const threadWithStatus = {
                    ...thread,
                    otherUser: {
                        ...thread.otherUser,
                        status: status
                    }
                };
                return (
                  <DMListItem
                    key={thread.threadId}
                    thread={threadWithStatus}
                    isActive={currentThreadId === thread.threadId}
                    onClick={() => handleDmClick(thread.threadId)}
                    onDelete={handleDeleteConversation}
                  />
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>


      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar 
              userId={currentUser.id}
              avatarUrl={currentUser.avatar_url} 
              fallbackName={displayName} 
              status={currentUser.status}
              className="h-8 w-8"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser.status || 'online'}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <EditProfileDialog />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};
