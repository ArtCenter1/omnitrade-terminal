import React from "react";
import { ProfileSidebar } from "./ProfileSidebar";
import { AccountInfo } from "./AccountInfo";
import { FAQSection } from "./FAQSection";

interface ProfileLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function ProfileLayout({ children, title }: ProfileLayoutProps) {
  return (
    <div className="bg-black text-white min-h-[calc(100vh-64px)]">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar */}
          <div className="hidden lg:block">
            <ProfileSidebar />
          </div>

          {/* Main content */}
          <div className="flex-1">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              {children}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:w-[300px]">
            <AccountInfo />
            <FAQSection />
          </div>
        </div>
      </div>
    </div>
  );
}
