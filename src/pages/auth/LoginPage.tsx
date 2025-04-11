import React, { useState } from "react"; // Import React
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
import { Link } from "react-router-dom";
import { Loader } from 'lucide-react'; // Import Loader

interface LoginPageProps {
  onLoginSubmit: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
}

export default function LoginPage({ onLoginSubmit, isLoading }: LoginPageProps) {
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSubmit(email, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <Card className="w-full max-w-sm bg-gray-950 border-gray-800">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-white">Login</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <button
                type="button" // Prevent form submission if inside a form
                onClick={(e) => { e.stopPropagation(); setShowMagicLink((prev) => !prev); }}
                className="ml-auto inline-block text-sm text-green-500 hover:underline focus:outline-none"
              >
                Forgot your password?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>
          {showMagicLink && (
            <Button variant="outline" className="w-full border-green-700 hover:bg-gray-800 text-green-500">
              Sign in with magic link
            </Button>
          )}
          <Button variant="outline" className="w-full border-gray-700 hover:bg-gray-800 text-white">
            Login with Google
          </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="underline text-green-500 hover:text-green-400">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}