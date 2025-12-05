import { Sidebar } from './Sidebar';
import { ChannelHeader } from './ChannelHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export const ChatLayout = () => {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <ChannelHeader />
        <MessageList />
        <MessageInput />
      </main>
    </div>
  );
};
