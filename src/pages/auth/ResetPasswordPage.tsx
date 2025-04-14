
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();


  useEffect(() => {
    // No-op for Firebase: password reset handled via email link
  }, [location.hash]);

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Firebase: instruct user to use the link in their email
    setErrorMessage(null);
    setIsSuccess(false);
    toast.info('Please use the password reset link sent to your email. If you did not receive it, request a new password reset.');
    setIsProcessing(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Please use the password reset link sent to your email to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-2 rounded-md mb-4 text-sm">
              {errorMessage}
            </div>
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
