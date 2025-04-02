
import { Bell, ChevronDown, CircleDollarSign, CreditCard, HelpCircle, Info, LogOut, Menu, Settings, Shield, User, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-black">
      <div className="flex items-center space-x-8">
        <Link to="/home" className="flex items-center cursor-pointer">
          <div className="bg-[#1A1A1A] p-2 flex items-center justify-center rounded">
            <img
              src="/placeholder.svg"
              alt="Logo"
              className="h-5 w-5"
            />
          </div>
        </Link>
        
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-1 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/20 text-primary">V</AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-300 hidden md:inline-block">Vincent</span>
                <ChevronDown size={16} className="text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-900 border border-gray-800 text-white" align="end">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-lg font-semibold">Vincent</p>
                <p className="text-sm text-gray-400">artcenter1@gmail.com</p>
              </div>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer hover:bg-gray-800">
                  <User className="mr-2 h-4 w-4" />
                  <span>User Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/preferences")} className="cursor-pointer hover:bg-gray-800">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Preferences</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/plan")} className="cursor-pointer hover:bg-gray-800">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Plan & Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/password")} className="cursor-pointer hover:bg-gray-800">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/security")} className="cursor-pointer hover:bg-gray-800">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Security (2FA)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/accounts")} className="cursor-pointer hover:bg-gray-800">
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>My Accounts</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/deposit")} className="cursor-pointer hover:bg-gray-800">
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  <span>Deposit/Withdraw</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/earn")} className="cursor-pointer hover:bg-gray-800">
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  <span>Earn</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/support")} className="cursor-pointer hover:bg-gray-800">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Support Center</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
