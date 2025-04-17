// Navbar component
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LogOut,
  User,
  Settings,
  Bell,
  ChevronDown,
  CreditCard,
  Lock,
  Shield,
  Wallet,
  LayoutDashboard,
  Users,
  Moon,
  Sun,
  BellOff,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedAccess, switchRole } from '@/hooks/useRoleBasedAccess';
import { useTheme } from 'next-themes';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { isAdmin, userRole } = useRoleBasedAccess();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Get current location to determine active page
  const location = window.location.pathname;

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

    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <div className="bg-[#131722] sticky top-0 z-50 theme-transition">
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
            <span className="font-bold text-xl ml-2 text-white">OMNITRADE</span>
          </Link>
        </div>

        <div className="flex-1 flex justify-center">
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/dashboard"
                    className={`${navigationMenuTriggerStyle()} text-white hover:text-white ${location.startsWith('/dashboard') ? 'bg-[#1e2230] font-bold border-b-2 border-blue-500' : ''}`}
                  >
                    Dashboard
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/terminal"
                    className={`${navigationMenuTriggerStyle()} text-white hover:text-white ${location.startsWith('/terminal') ? 'bg-[#1e2230] font-bold border-b-2 border-blue-500' : ''}`}
                  >
                    Terminal
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/bots"
                    className={`${navigationMenuTriggerStyle()} text-white hover:text-white ${location.startsWith('/bots') ? 'bg-[#1e2230] font-bold border-b-2 border-blue-500' : ''}`}
                  >
                    Bots
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/markets"
                    className={`${navigationMenuTriggerStyle()} text-white hover:text-white ${location.startsWith('/markets') ? 'bg-[#1e2230] font-bold border-b-2 border-blue-500' : ''}`}
                  >
                    Markets
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/earn"
                    className={`${navigationMenuTriggerStyle()} text-white hover:text-white ${location.startsWith('/earn') ? 'bg-[#1e2230] font-bold border-b-2 border-blue-500' : ''}`}
                  >
                    Earn
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/community"
                    className={`${navigationMenuTriggerStyle()} text-white hover:text-white ${location.startsWith('/community') ? 'bg-[#1e2230] font-bold border-b-2 border-blue-500' : ''}`}
                  >
                    Community
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Demo link */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/demo/exchange"
                    className={`${navigationMenuTriggerStyle()} hover:text-white ${location.startsWith('/demo/exchange') ? 'bg-[#1e2230] font-bold border-b-2 border-blue-500' : ''}`}
                  >
                    <span className="flex items-center text-blue-400 hover:text-blue-300">
                      Exchange Demo
                    </span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Admin link - only visible to admins */}
              {isAdmin && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/admin"
                      className={`${navigationMenuTriggerStyle()} ${location.startsWith('/admin') ? 'bg-[#1e2230] font-bold border-b-2 border-red-500' : ''}`}
                    >
                      <span className="flex items-center text-red-400">
                        <LayoutDashboard className="h-4 w-4 mr-1" />
                        Admin
                      </span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center space-x-4">
          {/* Settings Gear */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-theme-secondary hover:text-theme-primary theme-transition">
                <Settings size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 shadow-theme-md theme-transition bg-[#1a1a1c]"
            >
              <div className="p-2">
                <h3 className="font-medium text-sm mb-2 text-theme-secondary">
                  Settings
                </h3>
                <div className="space-y-3">
                  {/* Theme Toggle */}
                  <div className="settings-menu-item">
                    <div className="flex items-center space-x-2">
                      {theme === 'dark' ? (
                        <Moon size={16} className="text-theme-link" />
                      ) : (
                        <Sun size={16} className="text-warning-color" />
                      )}
                      <span className="settings-menu-item-label">
                        Dark Mode
                      </span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={theme === 'dark'}
                        onChange={() => {
                          setTheme(theme === 'dark' ? 'light' : 'dark');
                        }}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {/* Notifications Toggle */}
                  <div className="settings-menu-item">
                    <div className="flex items-center space-x-2">
                      {notificationsEnabled ? (
                        <Bell size={16} className="text-success-color" />
                      ) : (
                        <BellOff size={16} className="text-theme-tertiary" />
                      )}
                      <span className="settings-menu-item-label">
                        Order Notifications
                      </span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={() =>
                          setNotificationsEnabled(!notificationsEnabled)
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notification Bell */}
          <button
            className="text-theme-secondary hover:text-theme-primary theme-transition"
            title={
              notificationsEnabled
                ? 'Notifications enabled'
                : 'Notifications disabled'
            }
          >
            {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          </button>

          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 shadow-theme-md theme-transition bg-[#1a1a1c]"
                >
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm text-theme-primary">
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="w-[200px] truncate text-xs text-theme-secondary">
                        {user.email}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs mr-2 text-theme-secondary">
                          Role:
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${userRole === 'admin' ? 'bg-red-900 text-white' : userRole === 'premium' ? 'bg-purple-900 text-white' : 'bg-gray-700 text-gray-300'}`}
                        >
                          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-theme-tertiary" />
                  <DropdownMenuItem
                    onClick={() => navigate('/profile')}
                    className="cursor-pointer hover:bg-theme-hover text-theme-secondary theme-transition"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>User Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/profile/preferences')}
                    className="cursor-pointer hover:bg-theme-hover text-theme-secondary theme-transition"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Preferences</span>
                  </DropdownMenuItem>

                  {/* Admin Section */}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="bg-theme-tertiary" />
                      <div className="px-2 py-1.5 text-xs font-semibold text-theme-tertiary">
                        ADMIN ACCESS
                      </div>
                      <DropdownMenuItem
                        onClick={() => navigate('/admin')}
                        className="cursor-pointer hover:bg-red-900 bg-red-950 text-red-300"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate('/admin/users-roles')}
                        className="cursor-pointer hover:bg-red-900 bg-red-950 text-red-300"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <span>User & Role Management</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator className="bg-theme-tertiary" />
                  <DropdownMenuItem
                    onClick={() => navigate('/profile/subscription')}
                    className="cursor-pointer hover:bg-theme-hover text-theme-secondary theme-transition"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Plan & Subscription</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/profile/change-password')}
                    className="cursor-pointer hover:bg-theme-hover text-theme-secondary theme-transition"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    <span>Change Password</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/profile/security')}
                    className="cursor-pointer hover:bg-theme-hover text-theme-secondary theme-transition"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Security (2FA)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/profile/accounts')}
                    className="cursor-pointer hover:bg-theme-hover text-theme-secondary theme-transition"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>My Accounts</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-theme-tertiary" />

                  {/* Role Switcher */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium mb-1 text-theme-tertiary">
                      Switch Role (Testing)
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => switchRole('user')}
                        className={`text-xs px-2 py-1 rounded ${userRole === 'user' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      >
                        User
                      </button>
                      <button
                        onClick={() => switchRole('premium')}
                        className={`text-xs px-2 py-1 rounded ${userRole === 'premium' ? 'bg-purple-900 text-white' : 'bg-gray-800 text-gray-400 hover:bg-purple-900 hover:text-white'}`}
                      >
                        Premium
                      </button>
                      <button
                        onClick={() => switchRole('admin')}
                        className={`text-xs px-2 py-1 rounded ${userRole === 'admin' ? 'bg-red-900 text-white' : 'bg-gray-800 text-gray-400 hover:bg-red-900 hover:text-white'}`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="bg-theme-tertiary" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer hover:bg-theme-hover text-theme-secondary theme-transition"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate('/auth')}
                className="text-theme-primary theme-transition"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                className="btn-theme-primary theme-transition"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
