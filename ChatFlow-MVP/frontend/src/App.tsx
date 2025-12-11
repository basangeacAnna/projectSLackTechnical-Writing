import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ChatProvider } from "@/contexts/ChatContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import { DMNewPage } from "./pages/DMNewPage";
import { DMThreadPage } from "./pages/DMThreadPage";
import { Sidebar } from "@/components/chat/Sidebar";
import { useWebSocket } from "@/hooks/useWebSocket";

const queryClient = new QueryClient();

const PageLayout = () => {
  // Initialize WebSocket listeners for DM pages
  useWebSocket();
  
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 relative">
        <Outlet />
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ChatProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<PageLayout />}>
              <Route path="/app/direct-messages/new" element={<DMNewPage />} />
              <Route path="/app/direct-messages/:threadId" element={<DMThreadPage />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
