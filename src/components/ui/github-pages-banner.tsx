import React, { useState } from 'react';

/**
 * A banner component that displays a notice when the app is running on GitHub Pages
 */
const GitHubPagesBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  // Only show the banner on GitHub Pages
  const isGitHubPages = window.location.hostname.includes('github.io') || 
                        import.meta.env.VITE_USE_MOCK_API === 'true';

  if (!isGitHubPages || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black p-2 text-center text-sm">
      <div className="flex items-center justify-center gap-2">
        <span>
          ⚠️ This is a <strong>demo version</strong> running on GitHub Pages with mock data. No real trading is possible.
        </span>
        <button 
          onClick={() => setIsVisible(false)}
          className="bg-black text-white px-2 py-0.5 rounded text-xs"
          aria-label="Close banner"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default GitHubPagesBanner;
