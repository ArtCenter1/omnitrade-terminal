import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedAccess, UserRole } from '@/hooks/useRoleBasedAccess';
import { Loader2 } from 'lucide-react';

// Global function to toggle the debug panel
// Can be called from anywhere in the application
// To enable the debug panel, open the browser console and type: toggleRoleDebug()
(window as any).toggleRoleDebug = () => {
  const currentValue = localStorage.getItem('roleDebugHidden');
  const newValue = currentValue === 'true' ? 'false' : 'true';
  localStorage.setItem('roleDebugHidden', newValue);
  console.log(`Role debug panel is now ${newValue === 'true' ? 'hidden' : 'visible'}`);
  // Force a refresh to apply the change
  window.location.reload();
};

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/dashboard'
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const { userRole, isLoading: roleLoading } = useRoleBasedAccess();

  const isLoading = authLoading || roleLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-950">
        <Loader2 className="animate-spin h-8 w-8 text-green-500" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Environment check - only show debug in development
  // By default, hide the debug panel completely
  const isDevelopment = process.env.NODE_ENV === 'development';

  // To enable the debug panel for testing, uncomment the line above and comment out the line below
  // or use the toggleRoleDebug() function in the browser console

  // Create separate components for the debug panel and toggle button
  const RoleDebugPanel = ({ setDebugHidden }: { setDebugHidden: React.Dispatch<React.SetStateAction<boolean>> }) => {
    // Load saved position from localStorage or use default
    const getSavedPosition = () => {
      try {
        const savedPosition = localStorage.getItem('roleDebugPosition');
        if (savedPosition) {
          return JSON.parse(savedPosition);
        }
      } catch (error) {
        console.error('Error loading saved position:', error);
      }
      return { x: 16, y: window.innerHeight - 150 };
    };

    const [position, setPosition] = React.useState(getSavedPosition());
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

    // Handle mouse down event to start dragging
    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      // Calculate the offset from the mouse position to the top-left corner of the element
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    };

    // Handle hiding the debug panel
    const handleHide = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering drag
      localStorage.setItem('roleDebugHidden', 'true');
      setDebugHidden(true); // Dynamically hide the debug panel
    };

    // Handle mouse move event to update position while dragging
    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          setPosition({
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          });
        }
      };

      const handleMouseUp = () => {
        if (isDragging) {
          setIsDragging(false);
          // Save position to localStorage
          try {
            localStorage.setItem('roleDebugPosition', JSON.stringify(position));
          } catch (error) {
            console.error('Error saving position:', error);
          }
        }
      };

      // Add event listeners when dragging starts
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }

      // Clean up event listeners
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, dragOffset, position]);

    return (
      <div
        className={`fixed bg-black bg-opacity-80 text-white p-2 rounded-lg z-50 text-xs max-w-[200px] shadow-lg border border-gray-700 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transition: isDragging ? 'none' : 'box-shadow 0.2s ease-in-out'
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="flex items-center justify-between mb-1 pb-1 border-b border-gray-700"
          style={{ cursor: 'move' }}
        >
          <h3 className="font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M14 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
              <path d="M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
              <path d="M14 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
              <path d="M6 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
              <path d="M6 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
              <path d="M6 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
              <path d="M22 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
              <path d="M22 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
              <path d="M22 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
            </svg>
            Role Debug
          </h3>
          <div className="flex items-center">
            <div className="text-gray-400 text-[10px] mr-2">Drag to move</div>
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={handleHide}
              title="Hide Debug Panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
        </div>
        <p className="truncate">User: {user?.email}</p>
        <p>Role: <span className="font-semibold text-green-400">{userRole}</span></p>
        <p>Allowed: {allowedRoles.join(', ')}</p>
        <p>Access: <span className={allowedRoles.includes(userRole) ? 'text-green-400' : 'text-red-400'}>
          {allowedRoles.includes(userRole) ? 'Yes' : 'No'}
        </span></p>
        <button
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs w-full transition-colors"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    );
  };

  // Toggle button component
  const RoleDebugToggle = ({ setDebugHidden }: { setDebugHidden: React.Dispatch<React.SetStateAction<boolean>> }) => {
    const handleShow = () => {
      localStorage.setItem('roleDebugHidden', 'false');
      setDebugHidden(false); // Dynamically show the debug panel
    };

    return (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <button
          className="bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          onClick={handleShow}
          title="Show Role Debug Panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          <span>Show Role Debug</span>
        </button>
      </div>
    );
  };

  // Main debug component that decides which component to render
  const DebugInfo = () => {
    // Only show in development or if explicitly enabled
    if (!isDevelopment) return null;

    // React state to manage debug panel visibility
    const [debugHidden, setDebugHidden] = React.useState(
      localStorage.getItem('roleDebugHidden') === 'true'
    );

    // Return the appropriate component based on visibility state
    return debugHidden ? <RoleDebugToggle setDebugHidden={setDebugHidden} /> : <RoleDebugPanel setDebugHidden={setDebugHidden} />;
  };

  // If authenticated but doesn't have the required role
  if (!allowedRoles.includes(userRole)) {
    return (
      <>
        {isDevelopment && <DebugInfo />}
        <Navigate to={redirectTo} replace />
      </>
    );
  }

  // User is authenticated and has the required role
  return (
    <>
      {isDevelopment && <DebugInfo />}
      {children}
    </>
  );
};
