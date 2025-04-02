// ChevronDown might not be needed anymore if no other dropdowns use it
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LandingNavbar() {
  const navigate = useNavigate();

  // Removed communityItems array as it's no longer needed for the dropdown



  return (
    <div className="flex items-center justify-between p-4 bg-black text-white border-b border-gray-800 sticky top-0 z-50">
      <div className="flex items-center space-x-8">
        {/* Logo */}
        <Link to="/home" className="flex items-center cursor-pointer"> {/* Link logo to the main landing page */}
          <div className="bg-[#1A1A1A] p-2 flex items-center justify-center rounded">
            {/* Using placeholder, replace with actual logo if available */}
            <img
              src="/placeholder.svg" 
              alt="OmniTrade Logo"
              className="h-6 w-6" // Adjusted size slightly
            />
          </div>
           <span className="font-bold text-xl ml-2">OMNITRADE</span> {/* Updated Text Logo */}
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-6 items-center">
          {/* AI-Driven (formerly Cody AI) */}
          <Button
            variant="link"
            className="font-medium text-gray-300 hover:text-white p-0 h-auto"
            onClick={() => navigate("/cody-ai")} // Keep route path for now, can change later if needed
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
            onClick={() => navigate("/omni-token")} // Updated route
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
          variant="outline" // Using outline style as seen in images
          className="font-medium text-white border-purple-500 hover:bg-purple-500 hover:text-black"
          onClick={() => navigate("/")} // Link to the main dashboard at the root path
        >
          Dashboard <span aria-hidden="true" className="ml-1">→</span>
        </Button>
        {/* Add Mobile Menu Toggle if needed */}
        {/* <Button variant="ghost" className="md:hidden ml-4"> <Menu /> </Button> */}
      </div>
    </div>
  );
}