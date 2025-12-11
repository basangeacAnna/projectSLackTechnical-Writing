import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { UserProfileModal } from './UserProfileModal';

interface UserAvatarProps {
  userId?: string;
  avatarUrl?: string | null;
  fallbackName: string;
  status?: string;
  className?: string;
  showStatus?: boolean;
}

export function UserAvatar({ 
  userId,
  avatarUrl, 
  fallbackName, 
  status = 'offline', 
  className,
  showStatus = true 
}: UserAvatarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const statusColors: Record<string, string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (userId) {
      e.stopPropagation();
      setIsProfileOpen(true);
    }
  };

  return (
    <>
      <div 
        className={cn("relative inline-block", className, userId && "cursor-pointer")} 
        onClick={handleClick}
      >
        <Avatar className="h-full w-full">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary font-medium">
            {fallbackName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {showStatus && (
          <span 
            className={cn(
              "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background",
              statusColors[status] || statusColors.offline
            )} 
          />
        )}
      </div>

      {userId && (
        <UserProfileModal 
          userId={userId} 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
        />
      )}
    </>
  );
}
