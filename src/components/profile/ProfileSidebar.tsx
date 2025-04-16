import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Settings,
  CreditCard,
  Lock,
  Shield,
  Wallet,
  LogOut, // Added LogOut icon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // Added useAuth import

export function ProfileSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth(); // Get signOut function

  const handleSignOut = async () => {
    // Define handleSignOut
    await signOut();
    navigate("/");
  };

  const menuItems = [
    {
      name: "User Profile",
      path: "/profile",
      icon: <User size={16} className="mr-2" />,
    },
    {
      name: "Preferences",
      path: "/profile/preferences",
      icon: <Settings size={16} className="mr-2" />,
    },
    {
      name: "Plan & Subscription",
      path: "/profile/subscription",
      icon: <CreditCard size={16} className="mr-2" />,
    },
    {
      name: "Change Password",
      path: "/profile/change-password",
      icon: <Lock size={16} className="mr-2" />,
    },
    {
      name: "Security (2FA)",
      path: "/profile/security",
      icon: <Shield size={16} className="mr-2" />,
    },
    {
      name: "My Accounts",
      path: "/profile/accounts",
      icon: <Wallet size={16} className="mr-2" />,
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-[200px] bg-black">
      <ul className="py-4">
        {menuItems.map((item) => (
          <li key={item.path} className="mb-1">
            <button
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-3 flex items-center text-sm ${
                isActive(item.path)
                  ? "bg-purple-900 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          </li>
        ))}
        {/* Logout Button */}
        <li className="mb-1">
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 flex items-center text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <LogOut size={16} className="mr-2" />
            Log out
          </button>
        </li>
      </ul>
    </div>
  );
}
