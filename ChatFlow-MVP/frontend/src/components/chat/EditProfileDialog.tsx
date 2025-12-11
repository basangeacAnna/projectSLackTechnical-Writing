import React, { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserAvatar } from './UserAvatar';
import { Settings } from 'lucide-react';

export function EditProfileDialog() {
  const { currentUser, updateProfile } = useChat();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    display_name: currentUser?.display_name || '',
    bio: currentUser?.bio || '',
    status: currentUser?.status || 'online',
    avatar_url: currentUser?.avatar_url || '',
  });

  // Update form data when modal opens or user changes
  React.useEffect(() => {
    if (currentUser) {
      setFormData({
        display_name: currentUser.display_name || currentUser.username || '',
        bio: currentUser.bio || '',
        status: currentUser.status || 'online',
        avatar_url: currentUser.avatar_url || '',
      });
    }
  }, [currentUser, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      setOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="flex justify-center mb-4">
            <UserAvatar 
              avatarUrl={formData.avatar_url} 
              fallbackName={formData.display_name || 'User'} 
              status={formData.status as any}
              className="h-20 w-20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="avatar_url" className="text-right">
              Avatar URL
            </Label>
            <Input
              id="avatar_url"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              className="col-span-3"
              placeholder="https://example.com/avatar.png"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="display_name" className="text-right">
              Name
            </Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as 'online' | 'offline' | 'away' | 'dnd' })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="away">Away</SelectItem>
                <SelectItem value="dnd">Do Not Disturb</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bio" className="text-right">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="col-span-3"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
