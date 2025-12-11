import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useChat } from "@/contexts/ChatContext";

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  status: string;
  created_at: string;
  email: string;
}

export const UserProfileModal = ({ userId, isOpen, onClose }: UserProfileModalProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { usersMap } = useChat();

  useEffect(() => {
    if (isOpen && userId) {
      // First try to get from usersMap context
      if (usersMap[userId]) {
        setUser(usersMap[userId] as any);
      }
      
      // Also fetch fresh data to get bio etc if not in map
      setLoading(true);
      fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
          setUser(data);
        })
        .catch(err => console.error("Failed to fetch user profile", err))
        .finally(() => setLoading(false));
    }
  }, [userId, isOpen, usersMap]);

  if (!user) return null;

  const displayName = user.display_name || user.username;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <p className="text-muted-foreground">@{user.username}</p>
            <div className="flex justify-center mt-2">
              <Badge variant={
                user.status === 'online' ? 'default' : 
                user.status === 'dnd' ? 'destructive' : 
                'secondary'
              } className="capitalize">
                {user.status || 'offline'}
              </Badge>
            </div>
          </div>

          <div className="w-full space-y-4 mt-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium leading-none">About</h4>
              <ScrollArea className="h-[100px] w-full rounded-md border p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {user.bio || "No bio provided."}
                </p>
              </ScrollArea>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Joined</span>
                <span>{user.created_at ? format(new Date(user.created_at), 'PPP') : 'Unknown'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Email</span>
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
