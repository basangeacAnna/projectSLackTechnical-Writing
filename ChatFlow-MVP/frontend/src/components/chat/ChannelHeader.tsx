import { Hash, Lock, Users } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChannelHeaderProps {
  onToggleMembers: () => void;
  showMembers: boolean;
}

export const ChannelHeader = ({ onToggleMembers, showMembers }: ChannelHeaderProps) => {
  const { currentChannel, onlineCount } = useChat();

  if (!currentChannel) return null;

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 relative z-10">
      <div className="flex items-center gap-2">
        {currentChannel.is_private ? (
          <Lock className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Hash className="w-5 h-5 text-muted-foreground" />
        )}
        <h2 className="font-semibold text-foreground">
          {currentChannel.name}
        </h2>
      </div>
      
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "text-muted-foreground hover:text-foreground gap-1.5",
            showMembers && "bg-sidebar-accent text-foreground"
          )}
          onClick={onToggleMembers}
        >
          <Users className="w-4 h-4" />
          <span className="text-sm">{onlineCount}</span>
        </Button>
      </div>
    </header>
  );
};
