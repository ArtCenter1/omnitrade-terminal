
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import LoginPage from './LoginPage'; // Import LoginPage

const AuthPage = () => {
  // State for the login form
  // Removed: const [loginEmail, setLoginEmail] = useState('');
  // Removed: const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  // State for the registration form
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // State for forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState<null | 'success' | 'error'>(null);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string>('');

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Determine the initial tab based on the URL
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('/register')) return 'register';
    return 'login';
  };

  // Updated handleLogin to accept email and password
  const handleLogin = async (email: string, password: string) => {
    // e.preventDefault(); // Prevent default is handled within LoginPage's form
    setLoginLoading(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast.error(error.message || 'Failed to sign in');
      } else {
        toast.success('Signed in successfully');
        // Will be redirected by the useEffect above
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign in');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setRegisterLoading(true);

    try {
      const { error, success } = await signUp(registerEmail, registerPassword, userName);
      
      if (error) {
        toast.error(error.message || 'Failed to sign up');
      } else if (success) {
        setRegistrationSuccess(true);
        toast.success('Registration successful! Please check your email to confirm your account.');
        
        // Reset form
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
        
        // Switch to login tab
        document.getElementById('login-tab')?.click();
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during registration');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordStatus(null);
    setForgotPasswordMessage('');

    try {
      const response = await fetch('/api/auth/password-reset-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setForgotPasswordStatus('success');
        setForgotPasswordMessage(data.message || `If an account exists for ${forgotEmail}, we've sent a password reset link.`);
        // Optionally close dialog after a delay
        setTimeout(() => setForgotPasswordOpen(false), 2000);
      } else if (response.status === 429) {
        setForgotPasswordStatus('error');
        setForgotPasswordMessage(data.message || 'Too many requests. Please try again later.');
      } else {
        setForgotPasswordStatus('error');
        setForgotPasswordMessage(data.message || 'Failed to send reset link');
      }
    } catch (error: any) {
      setForgotPasswordStatus('error');
      setForgotPasswordMessage(error?.message || 'An error occurred while sending reset link');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 p-4">
      <div className="w-full max-w-md flex justify-center items-center">
        <Card className="border-gray-800 bg-gray-900 text-white shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">OmniTrade</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter your details to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={getInitialTab()} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger id="login-tab" value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                {/* Render the LoginPage component, passing the login handler and loading state */}
                <LoginPage
                  onLoginSubmit={handleLogin}
                  isLoading={loginLoading}
                />
                {/* Removed inline form and its "Forgot password?" button */}
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Username</Label>
                    <Input
                      id="userName"
                      type="text"
                      placeholder="your_username"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerEmail">Email</Label>
                    <Input 
                      id="registerEmail"
                      type="email"
                      placeholder="name@example.com"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">Password</Label>
                    <Input 
                      id="registerPassword"
                      type="password"
                      required
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input 
                      id="confirmPassword"
                      type="password"
                      required
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white" 
                    disabled={registerLoading}
                  >
                    {registerLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-gray-400 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Reset your password</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="forgotEmail">Email</Label>
              <Input
                id="forgotEmail"
                type="email"
                placeholder="name@example.com"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            {forgotPasswordStatus && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-2 ${
                  forgotPasswordStatus === 'success'
                    ? 'bg-green-900/20 border border-green-700 text-green-300'
                    : 'bg-red-900/20 border border-red-700 text-red-300'
                }`}
              >
                {forgotPasswordStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span>{forgotPasswordMessage}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotPasswordOpen(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center"
                disabled={forgotPasswordLoading}
              >
                {forgotPasswordLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Link'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthPage;
