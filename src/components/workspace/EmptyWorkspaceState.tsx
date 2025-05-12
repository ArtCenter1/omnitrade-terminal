import React from 'react';
// Assuming the Button component is located at src/components/ui/button.tsx
// and is exported as a named export. Adjust if the path or export is different.
import { Button } from '../ui/button';

const EmptyWorkspaceState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
      {/* Optional: A larger icon representing an empty state or workspace */}
      <svg
        className="w-20 h-20 text-neutral-300 dark:text-neutral-700 mb-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M4 7c0-1.1.9-2 2-2h4M4 7l4 4M20 7c0-1.1-.9-2-2-2h-4M20 7l-4 4m0 0l-4-4m4 4v6a2 2 0 002 2h2"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 12h.01v.01h-.01V12zm0-4h.01v.01h-.01V8zm0 8h.01v.01h-.01V16z"
        />
      </svg>

      <h2 className="text-2xl font-semibold mb-2 text-neutral-800 dark:text-neutral-200">
        Your workspace is empty
      </h2>
      <p className="mb-4 max-w-md">
        Click the button below or drag and drop modules onto the workspace to
        get started.
      </p>

      {/* Arrow/Line Indicator */}
      <div className="my-4">
        <svg
          className="w-10 h-10 text-blue-500 dark:text-blue-400 animate-bounce"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          ></path>
        </svg>
      </div>

      <Button
        variant="default" // Assuming 'default' or 'primary' variant exists
        size="lg"
        // onClick will be wired up later
        // onClick={() => console.log('Open Module Selector clicked')}
      >
        Add Module
      </Button>
    </div>
  );
};

export default EmptyWorkspaceState;
