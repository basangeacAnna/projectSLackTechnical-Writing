import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { useDmStore } from '@/stores/dmStore';
import { UserAvatar } from '@/components/chat/UserAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import './DMNewPage.css';

export const DMNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { usersMap, userStatusMap, currentUser } = useChat();
  const { startDm } = useDmStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  // Get all users except current user
  const allUsers = useMemo(() => {
    return Object.values(usersMap || {}).filter(
      (u) => u?.id !== currentUser?.id
    );
  }, [usersMap, currentUser]);

  // Helper to get display name
  const getLabel = (user: any): string => {
    return (user?.display_name || user?.username || '').toLowerCase();
  };

  // Filter by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers;

    const query = searchQuery.toLowerCase();
    return allUsers.filter(
      (u) =>
        getLabel(u).includes(query) ||
        (u?.display_name || '').toLowerCase().includes(query) ||
        (u?.username || '').toLowerCase().includes(query)
    );
  }, [allUsers, searchQuery]);

  // Separate online and offline
  const onlineUsers = useMemo(() => {
    return filteredUsers
      .filter((u) => userStatusMap?.[u.id] !== 'offline' && userStatusMap?.[u.id])
      .sort((a, b) => getLabel(a).localeCompare(getLabel(b)));
  }, [filteredUsers, userStatusMap]);

  const offlineUsers = useMemo(() => {
    return filteredUsers
      .filter((u) => !userStatusMap?.[u.id] || userStatusMap?.[u.id] === 'offline')
      .sort((a, b) => getLabel(a).localeCompare(getLabel(b)));
  }, [filteredUsers, userStatusMap]);

  // Handle user click → start DM
  const handleOpenDM = async (userId: string) => {
    try {
      const threadId = await startDm(userId);
      if (threadId) {
        navigate(`/app/direct-messages/${threadId}`);
      } else {
        toast({
            title: "Error",
            description: "Failed to start conversation. Please try again.",
            variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to start DM:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const hasResults = onlineUsers.length > 0 || offlineUsers.length > 0;

  return (
    <div className="dm-new-page">
      {/* HEADER */}
      <div className="dm-new-header">
        <h2 className="dm-new-title">Find or start a conversation</h2>
      </div>

      {/* SEARCH BAR */}
      <div className="dm-new-search-container">
        <Input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dm-new-search-input"
        />
      </div>

      {/* USERS LIST */}
      <ScrollArea className="dm-new-scroll">
        {!hasResults && searchQuery && (
          <div className="dm-new-empty">
            <p>No users found matching "{searchQuery}"</p>
          </div>
        )}

        {!hasResults && !searchQuery && (
          <div className="dm-new-empty">
            <p>No other users available</p>
          </div>
        )}

        {hasResults && (
          <div className="p-4">
            {/* ONLINE SECTION */}
            {onlineUsers.length > 0 && (
              <div className="dm-new-section">
                <p className="dm-new-section-label">
                  Online — {onlineUsers.length}
                </p>

                <div className="dm-new-users-list">
                  {onlineUsers.map((user) => {
                    const displayName =
                      user?.display_name || user?.username || 'Unknown';
                    const status = userStatusMap?.[user.id] || 'offline';

                    return (
                      <div
                        key={user.id}
                        className="dm-new-user-item online"
                        onClick={() => handleOpenDM(user.id)}
                      >
                        <div className="h-8 w-8">
                            <UserAvatar
                            avatarUrl={user?.avatar_url}
                            fallbackName={displayName}
                            status={status}
                            className="dm-new-avatar h-8 w-8"
                            showStatus={true}
                            />
                        </div>
                        <span className="dm-new-username">{displayName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DIVIDER */}
            {onlineUsers.length > 0 && offlineUsers.length > 0 && (
              <div className="dm-new-divider" />
            )}

            {/* OFFLINE SECTION */}
            {offlineUsers.length > 0 && (
              <div className="dm-new-section">
                <p className="dm-new-section-label">
                  Offline — {offlineUsers.length}
                </p>

                <div className="dm-new-users-list">
                  {offlineUsers.map((user) => {
                    const displayName =
                      user?.display_name || user?.username || 'Unknown';
                    const status = userStatusMap?.[user.id] || 'offline';

                    return (
                      <div
                        key={user.id}
                        className="dm-new-user-item offline"
                        onClick={() => handleOpenDM(user.id)}
                      >
                        <div className="h-8 w-8">
                            <UserAvatar
                            avatarUrl={user?.avatar_url}
                            fallbackName={displayName}
                            status={status}
                            className="dm-new-avatar h-8 w-8"
                            showStatus={true}
                            />
                        </div>
                        <span className="dm-new-username">{displayName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
