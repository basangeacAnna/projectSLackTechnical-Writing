import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { login } = useChat();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      const success = login(email, password);
      if (success) {
        toast.success('Welcome back!');
        navigate('/');
      } else {
        toast.error('Invalid credentials. Try: alice@chatflow.local');
      }
    } else {
      // Mock register - just login with the email
      toast.info('Registration is mocked. Logging in...');
      const success = login(email, password);
      if (success) {
        navigate('/');
      } else {
        toast.error('Use an existing mock user: alice@chatflow.local');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ChatFlow</h1>
          <p className="text-muted-foreground mt-1">
            {isLogin ? 'Sign in to your workspace' : 'Create your account'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  required={!isLogin}
                  className="bg-secondary border-border"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@chatflow.local"
                required
                className="bg-secondary border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-secondary border-border"
              />
            </div>

            <Button type="submit" className="w-full">
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Demo hint */}
          <div className="mt-6 p-3 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Demo:</strong> Use <code className="bg-background px-1 py-0.5 rounded">alice@chatflow.local</code> with any password
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          ChatFlow MVP • Frontend with Mock Data
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
