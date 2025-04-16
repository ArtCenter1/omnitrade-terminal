import React from "react";
import { ChevronDown } from "lucide-react";

export function AccountSelector() {
  return (
    <div className="mb-6">
      <div className="text-gray-400 mb-2 text-xs">Account</div>
      <div className="bg-gray-900 border border-gray-800 rounded p-2 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black"
            >
              <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
              <polygon points="12 15 17 21 7 21 12 15" />
            </svg>
          </div>
          <span className="text-white">Binance Artcenter1</span>
        </div>
        <ChevronDown size={16} className="text-gray-500" />
      </div>
    </div>
  );
}
