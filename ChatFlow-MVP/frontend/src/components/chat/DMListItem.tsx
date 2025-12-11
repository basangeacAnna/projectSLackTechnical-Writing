import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface DMListItemProps {
  thread: any; // Replace with proper type if available
  isActive: boolean;
  onClick: () => void;
  onDelete: (threadId: string) => void;
}

export const DMListItem = ({ thread, isActive, onClick, onDelete }: DMListItemProps) => {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(thread.threadId);
    setShowDeleteAlert(false);
  };

  return (
    <>
      <div
        onClick={onClick}
        className={cn(
          "group flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer transition-colors relative",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
        )}
      >
        <UserAvatar 
          userId={thread.otherUser.id}
          avatarUrl={thread.otherUser.avatar_url} 
          fallbackName={thread.otherUser.display_name || thread.otherUser.username}
          status={thread.otherUser.status}
          className="h-8 w-8"
          showStatus={true}
        />
        
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm truncate">
              {thread.otherUser.display_name || thread.otherUser.username}
            </span>
            {thread.unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full ml-1">
                {thread.unreadCount}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate opacity-80">
            {thread.lastMessage}
          </p>
        </div>

        <button
          onClick={handleDeleteClick}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 hover:text-destructive rounded",
            isActive && "opacity-100" // Always show on active item if desired, or keep hidden until hover
          )}
          title="Delete conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
              The conversation will be removed for all participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
