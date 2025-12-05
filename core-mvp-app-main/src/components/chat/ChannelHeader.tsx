import { Hash, Lock, Users, Settings } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';

export const ChannelHeader = () => {
  const { currentChannel, users } = useChat();

  if (!currentChannel) return null;

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
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
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
          <Users className="w-4 h-4" />
          <span className="text-sm">{users.length}</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};
