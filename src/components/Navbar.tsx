
import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  LogOut, 
  User, 
  Settings, 
  Bell, 
  ChevronDown,
  CreditCard, 
  Lock, 
  Shield, 
  Wallet 
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, signOut } = useAuth();
const isAdmin = useMemo(() => {
  if (!user) return false;
  return user.role === 'admin';
}, [user]);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = () => {
    if (!user) return '?';
    
    const name = user.user_metadata?.full_name || user.email || '';
    if (!name) return '?';
    
    const parts = name.split(' ');
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="border-b border-gray-800 bg-black sticky top-0 z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center cursor-pointer">
            <div className="bg-[#1A1A1A] p-2 flex items-center justify-center rounded">
              <img
                src="/placeholder.svg"
                alt="OmniTrade Logo"
                className="h-6 w-6"
              />
            </div>
            <span className="font-bold text-xl ml-2">OMNITRADE</span>
          </Link>
        </div>

        <div className="flex-1 flex justify-center">
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/dashboard">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Dashboard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/terminal">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Terminal
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/bots">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Bots
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/markets">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Markets
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/earn">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Earn
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/community">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Community
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
                {isAdmin && (
                  <>
                    <NavigationMenuItem>
                      <Link to="/admin/users">
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Manage Users
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <Link to="/admin/roles">
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Manage Roles
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  </>
                )}
              </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center justify-end space-x-4">
            {user ? (
              <>
                <Button variant="outline" size="icon" className="border-gray-800 text-gray-400">
                  <Bell size={18} />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center space-x-2 cursor-pointer">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm text-white">{user.user_metadata?.full_name || 'User'}</p>
                        <p className="w-[200px] truncate text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem 
                      onClick={() => navigate('/profile')}
                      className="cursor-pointer hover:bg-gray-800 text-gray-300"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>User Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate('/profile/preferences')}
                      className="cursor-pointer hover:bg-gray-800 text-gray-300"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Preferences</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate('/profile/subscription')}
                      className="cursor-pointer hover:bg-gray-800 text-gray-300"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Plan & Subscription</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate('/profile/change-password')}
                      className="cursor-pointer hover:bg-gray-800 text-gray-300"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      <span>Change Password</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate('/profile/security')}
                      className="cursor-pointer hover:bg-gray-800 text-gray-300"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Security (2FA)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate('/profile/accounts')}
                      className="cursor-pointer hover:bg-gray-800 text-gray-300"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>My Accounts</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer hover:bg-gray-800 text-gray-300"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')} className="text-white">
                  Sign In
                </Button>
                <Button onClick={() => navigate('/auth')} className="bg-primary">
                  Sign Up
                </Button>
              </>
            )}
        </div>
        </div>
      </div>
  );
}
