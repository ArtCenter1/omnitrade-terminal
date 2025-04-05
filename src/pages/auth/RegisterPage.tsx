
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

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <Card className="w-full max-w-sm bg-gray-950 border-gray-800">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-white">Create an account</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name" className="text-gray-300">First name</Label>
              <Input 
                id="first-name" 
                placeholder="Max" 
                required 
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name" className="text-gray-300">Last name</Label>
              <Input 
                id="last-name" 
                placeholder="Robinson" 
                required 
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500" 
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500" 
            />
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
            Create account
          </Button>
        </CardContent>
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
