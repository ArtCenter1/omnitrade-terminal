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

export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <Card className="w-full max-w-sm bg-gray-950 border-gray-800">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email address and we'll send you a link to reset your
            password.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Send Reset Link
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-center text-sm text-gray-400 space-y-2">
          <div>
            Remember your password?{" "}
            <Link
              to="/login"
              className="underline text-green-500 hover:text-green-400"
            >
              Login
            </Link>
          </div>
          <div>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="underline text-green-500 hover:text-green-400"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
