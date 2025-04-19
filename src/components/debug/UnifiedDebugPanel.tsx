import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedAccess, UserRole } from '@/hooks/useRoleBasedAccess';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

type DebugPanelProps = {
  allowedRoles?: UserRole[];
};

export function UnifiedDebugPanel({ allowedRoles = [] }: DebugPanelProps) {
  // State for panel visibility
  const [debugHidden, setDebugHidden] = useState(
    localStorage.getItem('debugPanelHidden') === 'true',
  );

  // State for mock user
  const [isMockUser, setIsMockUser] = useState(false);

  // Auth and role hooks
  const { user, signOut } = useAuth();
  const { userRole, updateRole } = useRoleBasedAccess();
  const location = useLocation();

  // Load saved position from localStorage or use default
  const getSavedPosition = () => {
    try {
      const savedPosition = localStorage.getItem('debugPanelPosition');
      if (savedPosition) {
        return JSON.parse(savedPosition);
      }
    } catch (error) {
      console.error('Error loading saved position:', error);
    }
    return { x: 16, y: window.innerHeight - 250 };
  };

  const [position, setPosition] = useState(getSavedPosition());
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Check localStorage on component mount and when user changes
  useEffect(() => {
    // Function to check mock user status
    const checkMockUserStatus = () => {
      const useMockUser = localStorage.getItem('useMockUser') === 'true';
      setIsMockUser(useMockUser);
    };

    // Check initially
    checkMockUserStatus();

    // Set up storage event listener to detect changes from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'useMockUser') {
        checkMockUserStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle mouse down event to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    // Calculate the offset from the mouse position to the top-left corner of the element
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Handle mouse move event to update position while dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        };
        setPosition(newPosition);
        // Save position to localStorage
        localStorage.setItem('debugPanelPosition', JSON.stringify(newPosition));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handle hiding the debug panel
  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering drag
    localStorage.setItem('debugPanelHidden', 'true');
    setDebugHidden(true);
  };

  // Handle showing the debug panel
  const handleShow = () => {
    localStorage.setItem('debugPanelHidden', 'false');
    setDebugHidden(false);
  };

  // Toggle mock user
  const toggleMockUser = () => {
    console.log('Toggle mock user clicked. Current state:', {
      isMockUser,
      userRole,
      user: user?.email,
    });

    try {
      if (isMockUser) {
        // If currently using mock user, sign out
        console.log('Disabling mock user mode');

        // First clear all localStorage items related to mock user
        localStorage.removeItem('useMockUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');

        // Update state
        setIsMockUser(false);

        // Show immediate visual feedback
        toast.success('Disabling mock user...');

        // Sign out the current user
        signOut();

        // Redirect to auth page instead of reloading
        console.log('Redirecting to auth page...');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 1000);
      } else {
        // If not using mock user, enable it
        console.log('Enabling mock user mode');

        // Store current user email before enabling mock mode
        if (user?.email) {
          localStorage.setItem('userEmail', user.email);
        }

        // Enable mock user
        localStorage.setItem('useMockUser', 'true');
        setIsMockUser(true);

        // Set default role for mock user
        localStorage.setItem('userRole', 'user');

        // Show immediate visual feedback
        toast.success('Enabling mock user...');

        // Reload the page to apply the mock user
        console.log('Reloading page to apply mock user...');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Error toggling mock user:', error);
      toast.error('Error toggling mock user');
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Check if user has access to the current route
  const hasAccess =
    allowedRoles.length === 0 || allowedRoles.includes(userRole);

  // Debug Panel Component
  const DebugPanel = () => (
    <div
      className="fixed z-50 bg-gray-800 text-white p-3 rounded-lg shadow-lg text-xs w-64"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex justify-between items-center mb-2 select-none">
        <h3 className="font-semibold flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="M12 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
            <path d="M12 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
            <path d="M12 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
            <path d="M22 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
            <path d="M22 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
            <path d="M22 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
          </svg>
          Debug Panel
          {isMockUser && (
            <span className="ml-2 px-1.5 py-0.5 text-[9px] font-semibold bg-yellow-600 text-white rounded-sm">
              MOCK
            </span>
          )}
        </h3>
        <div className="flex items-center">
          <div className="text-gray-400 text-[10px] mr-2">Drag to move</div>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={handleHide}
            title="Hide Debug Panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* User Info Section */}
      <div className="mb-3 pb-3 border-b border-gray-700">
        {isMockUser && (
          <div className="mb-2 p-1.5 bg-yellow-900/50 border border-yellow-700/50 rounded-sm">
            <p className="text-yellow-300 text-[10px] font-semibold flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              MOCK MODE ACTIVE
            </p>
            <p className="text-[9px] text-yellow-200/80 mt-1">
              Using simulated data. API calls are intercepted.
            </p>
          </div>
        )}
        <p className="truncate">
          <span className="text-gray-400">User:</span>{' '}
          {user?.email || 'Not signed in'}
        </p>
        <p>
          <span className="text-gray-400">Auth Type:</span>{' '}
          <span
            className={
              isMockUser ? 'text-yellow-400 font-semibold' : 'text-green-400'
            }
          >
            {isMockUser ? 'Mock User' : 'Real User'}
          </span>
        </p>
        <div className="mt-2">
          <Button
            onClick={toggleMockUser}
            variant={isMockUser ? 'destructive' : 'default'}
            size="sm"
            className={`w-full text-xs h-7 ${isMockUser ? 'bg-yellow-600 hover:bg-yellow-700 border-yellow-800' : ''}`}
          >
            {isMockUser ? 'Disable Mock User' : 'Enable Mock User'}
          </Button>
        </div>
      </div>

      {/* Role Info Section */}
      <div className="mb-3 pb-3 border-b border-gray-700">
        <p>
          <span className="text-gray-400">Current Role:</span>{' '}
          <span className="font-semibold text-green-400">{userRole}</span>
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Switching to User role');
              try {
                // Directly update localStorage to ensure it works
                localStorage.setItem('userRole', 'user');
                // Then call updateRole to trigger UI updates
                updateRole('user');
                toast.success('Switched to User role');
                // Force reload after a short delay
                setTimeout(() => window.location.reload(), 500);
              } catch (error) {
                console.error('Error switching role:', error);
                toast.error('Error switching role');
              }
            }}
            variant={userRole === 'user' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs h-7 ${
              userRole === 'user' ? 'bg-blue-600 hover:bg-blue-700' : ''
            }`}
          >
            User
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Switching to Premium role');
              try {
                // Directly update localStorage to ensure it works
                localStorage.setItem('userRole', 'premium');
                // Then call updateRole to trigger UI updates
                updateRole('premium');
                toast.success('Switched to Premium role');
                // Force reload after a short delay
                setTimeout(() => window.location.reload(), 500);
              } catch (error) {
                console.error('Error switching role:', error);
                toast.error('Error switching role');
              }
            }}
            variant={userRole === 'premium' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs h-7 ${
              userRole === 'premium' ? 'bg-purple-600 hover:bg-purple-700' : ''
            }`}
          >
            Premium
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Switching to Admin role');
              try {
                // Directly update localStorage to ensure it works
                localStorage.setItem('userRole', 'admin');
                // Then call updateRole to trigger UI updates
                updateRole('admin');
                toast.success('Switched to Admin role');
                // Force reload after a short delay
                setTimeout(() => window.location.reload(), 500);
              } catch (error) {
                console.error('Error switching role:', error);
                toast.error('Error switching role');
              }
            }}
            variant={userRole === 'admin' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs h-7 ${
              userRole === 'admin' ? 'bg-red-600 hover:bg-red-700' : ''
            }`}
          >
            Admin
          </Button>
        </div>
      </div>

      {/* Route Access Section */}
      {allowedRoles.length > 0 && (
        <div className="mb-3 pb-3 border-b border-gray-700">
          <p>
            <span className="text-gray-400">Current Path:</span>{' '}
            <span className="truncate inline-block max-w-[180px]">
              {location.pathname}
            </span>
          </p>
          <p>
            <span className="text-gray-400">Allowed Roles:</span>{' '}
            {allowedRoles.join(', ')}
          </p>
          <p>
            <span className="text-gray-400">Access:</span>{' '}
            <span className={hasAccess ? 'text-green-400' : 'text-red-400'}>
              {hasAccess ? 'Yes' : 'No'}
            </span>
          </p>
        </div>
      )}

      {/* Actions Section */}
      <div>
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </div>
    </div>
  );

  // Toggle Button Component
  const ToggleButton = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        className={`${isMockUser ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'} text-white p-2 rounded-lg shadow-lg transition-colors flex items-center gap-2 relative`}
        onClick={handleShow}
        title="Show Debug Panel"
      >
        {isMockUser && (
          <span className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full border border-yellow-700 flex items-center justify-center">
            <span className="text-[8px] font-bold">M</span>
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        </svg>
        <span>Debug Panel</span>
      </Button>
    </div>
  );

  return debugHidden ? <ToggleButton /> : <DebugPanel />;
}

// Add global function to toggle the debug panel
(window as any).toggleDebugPanel = () => {
  const currentValue = localStorage.getItem('debugPanelHidden');
  const newValue = currentValue === 'true' ? 'false' : 'true';
  localStorage.setItem('debugPanelHidden', newValue);
  console.log(
    `Debug panel is now ${newValue === 'true' ? 'hidden' : 'visible'}`,
  );
  // Force a refresh to apply the change
  window.location.reload();
};
