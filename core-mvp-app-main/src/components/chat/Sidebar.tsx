import { Hash, Lock, LogOut, ChevronDown, Plus } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

const StatusIndicator = ({ status }: { status: string }) => {
  const statusColors = {
    online: 'bg-chat-online',
    away: 'bg-chat-away',
    dnd: 'bg-chat-dnd',
    offline: 'bg-chat-offline',
  };

  return (
    <span 
      className={cn(
        'w-2.5 h-2.5 rounded-full',
        statusColors[status as keyof typeof statusColors] || statusColors.offline
      )} 
    />
  );
};

export const Sidebar = () => {
  const { 
    currentUser, 
    currentWorkspace, 
    currentChannel, 
    channels, 
    setCurrentChannel, 
    logout 
  } = useChat();
  
  const [channelsOpen, setChannelsOpen] = useState(true);

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
            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setCurrentChannel(channel)}
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
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                {currentUser.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5">
                <StatusIndicator status={currentUser.status} />
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {currentUser.display_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser.status}
              </p>
            </div>
          </div>
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
    </aside>
  );
};
