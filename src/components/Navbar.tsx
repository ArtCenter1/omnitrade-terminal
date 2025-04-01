
import { Bell, ChevronDown, CircleDollarSign, Info, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

export function Navbar() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-black">
      <div className="flex items-center space-x-8">
        <div className="flex items-center">
          <div className="bg-[#1A1A1A] p-2 flex items-center justify-center rounded">
            <img 
              src="/placeholder.svg" 
              alt="Logo" 
              className="h-5 w-5" 
            />
          </div>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <Button 
            variant="ghost" 
            className="font-medium text-white hover:text-white hover:bg-gray-800" 
            onClick={() => navigate("/")}
          >
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className="font-medium text-gray-400 hover:text-white hover:bg-gray-800" 
            onClick={() => navigate("/terminal")}
          >
            Terminal
          </Button>
          <Button 
            variant="ghost" 
            className="font-medium text-gray-400 hover:text-white hover:bg-gray-800" 
            onClick={() => navigate("/bots")}
          >
            Bots
          </Button>
          <Button 
            variant="ghost" 
            className="font-medium text-gray-400 hover:text-white hover:bg-gray-800" 
            onClick={() => navigate("/earn")}
          >
            Earn
          </Button>
          <Button 
            variant="ghost" 
            className="font-medium text-gray-400 hover:text-white hover:bg-gray-800" 
            onClick={() => navigate("/markets")}
          >
            Markets
          </Button>
        </nav>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="hidden lg:flex items-center mr-2">
          <span className="text-yellow-500 mr-1">
            <Info size={16} />
          </span>
          <div className="bg-yellow-500 bg-opacity-20 text-yellow-500 text-xs px-2 py-1 rounded">
            UPGRADE
          </div>
        </div>
        
        <Button variant="ghost" className="text-gray-400 rounded-full p-2">
          <Bell size={18} />
        </Button>
        
        <Button variant="ghost" className="text-gray-400 rounded-full p-2">
          <Settings size={18} />
        </Button>
        
        <div className="flex items-center space-x-1 ml-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary">V</AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-300 hidden md:inline-block">Vincent</span>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
}
