
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LandingNavbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-between p-4 bg-black text-white border-b border-gray-800 sticky top-0 z-50">
      <div className="flex items-center space-x-8">
        {/* Logo - Fixed the link to point to root "/" instead of "/home" */}
        <Link to="/" className="flex items-center cursor-pointer">
          <div className="bg-[#1A1A1A] p-2 flex items-center justify-center rounded">
            {/* Using placeholder, replace with actual logo if available */}
            <img
              src="/placeholder.svg" 
              alt="OmniTrade Logo"
              className="h-6 w-6"
            />
          </div>
           <span className="font-bold text-xl ml-2">OMNITRADE</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-6 items-center">
          {/* AI-Driven (formerly Cody AI) */}
          <Button
            variant="link"
            className="font-medium text-gray-300 hover:text-white p-0 h-auto"
            onClick={() => navigate("/cody-ai")}
          >
            AI-Driven
          </Button>
          {/* Trading Bots */}
          <Button
            variant="link"
            className="font-medium text-gray-300 hover:text-white p-0 h-auto"
            onClick={() => navigate("/trading-bots")}
          >
            Trading Bots
          </Button>

          {/* Community Link (Directly to Blog) */}
          <Button
            variant="link"
            className="font-medium text-gray-300 hover:text-white p-0 h-auto"
            onClick={() => navigate("/blog")}
          >
            Community
          </Button>

          {/* Omni Token */}
          <Button
            variant="link"
            className="font-medium text-gray-300 hover:text-white p-0 h-auto"
            onClick={() => navigate("/omni-token")}
          >
            Omni Token
          </Button>
          {/* Pricing */}
          <Button
            variant="link"
            className="font-medium text-gray-300 hover:text-white p-0 h-auto"
            onClick={() => navigate("/pricing")}
          >
            Pricing
          </Button>

        </nav>
      </div>

      {/* Dashboard Button */}
      <div className="flex items-center">
        <Button
          variant="outline"
          className="font-medium text-white border-purple-500 hover:bg-purple-500 hover:text-black"
          onClick={() => navigate(user ? "/dashboard" : "/auth")}
        >
          {user ? "Dashboard" : "Sign In"} <span aria-hidden="true" className="ml-1">→</span>
        </Button>
      </div>
    </div>
  );
}
