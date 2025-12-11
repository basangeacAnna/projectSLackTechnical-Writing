import { useChat } from '@/contexts/ChatContext';
import { useAppStore } from '@/stores/useAppStore';
import { UserAvatar } from './UserAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MembersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const isOfflineStatus = (status?: User['status']) => !status || status === 'offline';

const getUserLabel = (user: { display_name?: string; username?: string }) =>
  (user.display_name || user.username || '').toLowerCase();

export const MembersSidebar = ({ isOpen, onClose }: MembersSidebarProps) => {
  const { currentUser, channelMembers } = useChat();
  const { userStatusMap } = useAppStore();

  // Partiamo da tutti i membri noti del canale (backend)
  const baseUsers: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string | null;
    status?: User['status'];
  }[] = channelMembers.map(m => ({
    id: m.id,
    username: m.username || undefined,
    display_name: m.display_name || undefined,
    avatar_url: m.avatar_url ?? null,
    status: m.status,
  }));

  // Assicuriamoci che l'utente corrente sia sempre presente
  if (currentUser && !baseUsers.some(u => u.id === currentUser.id)) {
    baseUsers.push({
      id: currentUser.id,
      username: currentUser.username || undefined,
      display_name: currentUser.display_name || undefined,
      avatar_url: currentUser.avatar_url ?? null,
      status: currentUser.status,
    });
  }

  // Applichiamo lo stato più aggiornato da userStatusMap
  const usersArray = baseUsers.map(user => ({
    ...user,
    status: userStatusMap[user.id] || user.status || 'offline',
  }));

  // ORDINAMENTO ALFABETICO PER TUTTI
  const onlineUsers = usersArray
    .filter(user => !isOfflineStatus(user.status))
    .sort((a, b) => getUserLabel(a).localeCompare(getUserLabel(b)));

  const offlineUsers = usersArray
    .filter(user => isOfflineStatus(user.status))
    .sort((a, b) => getUserLabel(a).localeCompare(getUserLabel(b)));

  return (
    <aside 
      className={cn(
        "w-60 bg-sidebar border-l border-sidebar-border flex flex-col h-full",
        "fixed right-0 top-0 z-20 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">
          Members — {onlineUsers.length}
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">

          {/* ONLINE USERS */}
          {onlineUsers.map(user => {
            const displayName = user.display_name || user.username || 'Unknown';
            return (
              <div
                key={user.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar-accent transition-colors"
              >
                <UserAvatar
                  userId={user.id}
                  avatarUrl={user.avatar_url}
                  fallbackName={displayName}
                  status={user.status}
                  className="h-8 w-8"
                  showStatus={true}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {displayName}
                  </p>
                  {user.status && user.status !== 'online' && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.status}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* OFFLINE SECTION */}
          {offlineUsers.length > 0 && (
            <>
              {/* Divider stile Discord */}
              <div className="px-2 mt-3 mb-1">
                <div className="h-px w-full bg-sidebar-border" />
              </div>

              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground px-2 uppercase">
                Offline — {offlineUsers.length}
              </p>

              {offlineUsers.map(user => {
                const displayName = user.display_name || user.username || 'Unknown';
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar-accent transition-colors"
                  >
                    <UserAvatar
                      userId={user.id}
                      avatarUrl={user.avatar_url}
                      fallbackName={displayName}
                      status={user.status}
                      className="h-8 w-8"
                      showStatus={true}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {displayName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};
