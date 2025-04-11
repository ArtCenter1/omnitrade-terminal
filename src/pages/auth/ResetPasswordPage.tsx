
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader, CheckCircle, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  
  // Get hash fragment from URL which contains the access token
  const location = useLocation();
  
  useEffect(() => {
    // The hash contains the access token
    const hashParams = new URLSearchParams(location.hash.substring(1));
    
    if (!hashParams.get('access_token')) {
      setErrorMessage('Invalid or expired password reset link. Please request a new one.');
    }
  }, [location.hash]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      // The updateUser method will use the access token from the URL automatically
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        setErrorMessage(error.message);
        toast.error('Failed to reset password: ' + error.message);
      } else {
        setIsSuccess(true);
        toast.success('Password has been reset successfully');
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred while resetting your password');
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center text-gray-400">
            {isSuccess 
              ? 'Your password has been reset successfully!' 
              : 'Enter your new password below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-800 text-red-300 px-4 py-2 rounded-md mb-4 text-sm">
              <XCircle className="w-5 h-5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          {isSuccess ? (
            <div className="flex items-center gap-2 bg-green-900/20 border border-green-800 text-green-300 px-4 py-2 rounded-md mb-4 text-sm">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Password reset successful! You'll be redirected to the login page shortly.</span>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter your new password"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your new password"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            className="text-green-500 hover:text-green-400"
            onClick={() => navigate('/auth')}
          >
            Return to login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export { ResetPasswordPage };
