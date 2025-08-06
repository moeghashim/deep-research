'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogIn, LogOut, UserPlus } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export function AuthMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = authSchema.parse(formData);
      
      const result = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        toast.success('Successfully signed in!');
        setIsSignInOpen(false);
        setFormData({ email: '', password: '' });
        router.refresh();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Sign in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = authSchema.parse(formData);
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        toast.success('Account created successfully!');
        setIsSignUpOpen(false);
        setFormData({ email: '', password: '' });
        
        // Auto sign in after successful registration
        await signIn('credentials', {
          email: validatedData.email,
          password: validatedData.password,
          redirect: false,
        });
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    toast.success('Signed out successfully');
    router.push('/');
    router.refresh();
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  if (status === 'loading') {
    return (
      <Button variant="outline" size="sm" disabled>
        <User className="w-4 h-4" />
      </Button>
    );
  }

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Avatar className="w-5 h-5">
              <AvatarImage src={session.user.image || ''} alt={session.user.email || ''} />
              <AvatarFallback className="text-xs">
                {getInitials(session.user.email || 'U')}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline-block text-sm">
              {session.user.email?.includes('@anonymous.user') 
                ? 'Anonymous' 
                : session.user.email?.split('@')[0]
              }
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem className="flex items-center gap-2" disabled>
            <User className="w-4 h-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {session.user.email?.includes('@anonymous.user') 
                  ? 'Anonymous User' 
                  : session.user.email
                }
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600">
            <LogOut className="w-4 h-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsSignInOpen(true)}
          className="flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span className="hidden md:inline">Sign In</span>
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => setIsSignUpOpen(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden md:inline">Sign Up</span>
        </Button>
      </div>

      {/* Sign In Dialog */}
      <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In</DialogTitle>
            <DialogDescription>
              Enter your credentials to access your account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSignInOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sign Up Dialog */}
      <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>
              Create a new account to get started with deep research
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Create a password (min. 6 characters)"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSignUpOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}