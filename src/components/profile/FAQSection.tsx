import React from "react";

export function FAQSection() {
  return (
    <div className="bg-gray-900 rounded-lg p-4 w-full">
      <h3 className="text-lg font-medium text-white mb-4">FAQs</h3>

      <div className="space-y-3">
        <a href="#" className="block text-sm text-gray-300 hover:text-white">
          What is 2FA?
        </a>
        <a href="#" className="block text-sm text-gray-300 hover:text-white">
          How do I link an exchange?
        </a>
        <a href="#" className="block text-sm text-gray-300 hover:text-white">
          What are exchange APIs?
        </a>
        <a
          href="#"
          className="block text-sm text-purple-500 hover:text-purple-400 font-medium"
        >
          Visit Support Center
        </a>
      </div>
    </div>
  );
}
