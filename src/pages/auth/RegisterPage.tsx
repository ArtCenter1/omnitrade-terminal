import React, { useState } from 'react'; // Add useState
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom"; // Add useNavigate
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { toast } from 'sonner'; // Import toast for notifications
// Remove this duplicate import line

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth(); // Get signUp function
  const navigate = useNavigate(); // For redirection

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setIsLoading(true);

    // Basic validation (can be enhanced)
    if (!fullName || !email || !password) {
      setError('All fields are required.');
      toast.error('All fields are required.');
      setIsLoading(false);
      return;
    }

    try {
      // Use the 'fullName' state variable as the 'userName' argument
      const { error: signUpError, success } = await signUp(email, password, fullName);

      if (signUpError) {
        const errorMessage = signUpError.message || 'Failed to create account. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (success) {
        toast.success('Account created successfully! Please check your email to confirm your account.');
        // Optionally redirect or clear form
        // navigate('/login'); // Example redirect
        setFullName('');
        setEmail('');
        setPassword('');
        // Consider redirecting to a page telling the user to check their email
        // navigate('/auth/check-email');
      }
    } catch (err: any) {
      console.error("Registration submit error:", err);
      const errorMessage = 'An unexpected error occurred during registration.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <Card className="w-full max-w-sm bg-gray-950 border-gray-800">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-white">Create an account</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        {/* Add form element and onSubmit handler */}
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            {/* Add error display */}
            {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="full-name" className="text-gray-300">Full Name</Label>
            <Input
              id="full-name"
              placeholder="Max Robinson"
              required
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500"
              value={fullName} // Add value prop
              onChange={(e) => setFullName(e.target.value)} // Add onChange handler
              disabled={isLoading} // Disable during loading
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500"
              value={email} // Add value prop
              onChange={(e) => setEmail(e.target.value)} // Add onChange handler
              disabled={isLoading} // Disable during loading
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500"
              value={password} // Add value prop
              onChange={(e) => setPassword(e.target.value)} // Add onChange handler
              disabled={isLoading} // Disable during loading
            />
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50" disabled={isLoading}>
            {/* Update button text based on loading state */}
            {isLoading ? 'Creating Account...' : 'Create account'}
          </Button>
          </CardContent>
        </form> {/* Close form element */}
        <CardFooter className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="underline text-green-500 hover:text-green-400">
            Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
