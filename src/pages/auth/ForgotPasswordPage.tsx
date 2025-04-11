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
import { useState } from "react";
import { Loader, CheckCircle, XCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setMessage("");

    try {
      const response = await fetch("/api/auth/password-reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setStatus("success");
        setMessage(data.message || `If an account exists for ${email}, we've sent a password reset link.`);
      } else if (response.status === 429) {
        setStatus("error");
        setMessage(data.message || "Too many requests. Please try again later.");
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to send reset link");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message || "An error occurred while sending reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4">
      <Card className="w-full max-w-sm bg-gray-950 border-gray-800">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-white">Forgot Password</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            {status && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-2 ${
                  status === "success"
                    ? "bg-green-900/20 border border-green-700 text-green-300"
                    : "bg-red-900/20 border border-red-700 text-red-300"
                }`}
              >
                {status === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span>{message}</span>
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-center text-sm text-gray-400 space-y-2">
          <div>
            Remember your password?{" "}
            <Link to="/login" className="underline text-green-500 hover:text-green-400">
              Login
            </Link>
          </div>
          <div>
            Don't have an account?{" "}
            <Link to="/register" className="underline text-green-500 hover:text-green-400">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}