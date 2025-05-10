import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViewDescriptor, ActivityBarItem } from '@/types/layout';

// Default views
const defaultViews: ViewDescriptor[] = [
  {
    id: 'explorer',
    name: 'Explorer',
    icon: 'icon-explorer',
    order: 1,
    containerLocation: 'primary-sidebar',
    defaultLocation: 'primary-sidebar',
    canMove: true,
    canClose: false,
  },
  {
    id: 'search',
    name: 'Search',
    icon: 'icon-search',
    order: 2,
    containerLocation: 'primary-sidebar',
    defaultLocation: 'primary-sidebar',
    canMove: true,
    canClose: false,
  },
  {
    id: 'source-control',
    name: 'Source Control',
    icon: 'icon-source-control',
    order: 3,
    containerLocation: 'primary-sidebar',
    defaultLocation: 'primary-sidebar',
    canMove: true,
    canClose: false,
  },
  {
    id: 'debug',
    name: 'Run and Debug',
    icon: 'icon-debug',
    order: 4,
    containerLocation: 'primary-sidebar',
    defaultLocation: 'primary-sidebar',
    canMove: true,
    canClose: false,
  },
  {
    id: 'extensions',
    name: 'Extensions',
    icon: 'icon-extensions',
    order: 5,
    containerLocation: 'primary-sidebar',
    defaultLocation: 'primary-sidebar',
    canMove: true,
    canClose: false,
  },
  {
    id: 'chat',
    name: 'Chat',
    icon: 'icon-chat',
    order: 1,
    containerLocation: 'secondary-sidebar',
    defaultLocation: 'secondary-sidebar',
    canMove: true,
    canClose: false,
  },
  {
    id: 'outline',
    name: 'Outline',
    icon: 'icon-outline',
    order: 2,
    containerLocation: 'secondary-sidebar',
    defaultLocation: 'secondary-sidebar',
    canMove: true,
    canClose: false,
  },
];

// Default activity bar items
const defaultActivityBarItems: ActivityBarItem[] = [
  {
    id: 'explorer',
    name: 'Explorer',
    icon: 'icon-explorer',
    order: 1,
    target: 'view',
    viewId: 'explorer',
  },
  {
    id: 'search',
    name: 'Search',
    icon: 'icon-search',
    order: 2,
    target: 'view',
    viewId: 'search',
  },
  {
    id: 'source-control',
    name: 'Source Control',
    icon: 'icon-source-control',
    order: 3,
    target: 'view',
    viewId: 'source-control',
    badge: 0,
  },
  {
    id: 'debug',
    name: 'Run and Debug',
    icon: 'icon-debug',
    order: 4,
    target: 'view',
    viewId: 'debug',
  },
  {
    id: 'extensions',
    name: 'Extensions',
    icon: 'icon-extensions',
    order: 5,
    target: 'view',
    viewId: 'extensions',
  },
];

interface ViewContextType {
  views: ViewDescriptor[];
  activityBarItems: ActivityBarItem[];
  activeViewId: string | null;
  activeSecondaryViewId: string | null;
  setActiveViewId: (id: string | null) => void;
  setActiveSecondaryViewId: (id: string | null) => void;
  registerView: (view: ViewDescriptor) => void;
  unregisterView: (id: string) => void;
  moveView: (
    id: string,
    location: 'primary-sidebar' | 'secondary-sidebar' | 'panel',
  ) => void;
  registerActivityBarItem: (item: ActivityBarItem) => void;
  unregisterActivityBarItem: (id: string) => void;
}

const defaultViewContext: ViewContextType = {
  views: defaultViews,
  activityBarItems: defaultActivityBarItems,
  activeViewId: 'explorer',
  activeSecondaryViewId: 'chat',
  setActiveViewId: () => {},
  setActiveSecondaryViewId: () => {},
  registerView: () => {},
  unregisterView: () => {},
  moveView: () => {},
  registerActivityBarItem: () => {},
  unregisterActivityBarItem: () => {},
};

const ViewContext = createContext<ViewContextType>(defaultViewContext);

export const useViewContext = () => useContext(ViewContext);

export const ViewProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [views, setViews] = useState<ViewDescriptor[]>(defaultViews);
  const [activityBarItems, setActivityBarItems] = useState<ActivityBarItem[]>(
    defaultActivityBarItems,
  );
  const [activeViewId, setActiveViewId] = useState<string | null>('explorer');
  const [activeSecondaryViewId, setActiveSecondaryViewId] = useState<
    string | null
  >('chat');

  // Load saved view state from localStorage on component mount
  useEffect(() => {
    try {
      const savedViewState = localStorage.getItem('vscode-view-state');
      if (savedViewState) {
        const parsedState = JSON.parse(savedViewState);

        if (parsedState.activeViewId) {
          setActiveViewId(parsedState.activeViewId);
        }

        if (parsedState.activeSecondaryViewId) {
          setActiveSecondaryViewId(parsedState.activeSecondaryViewId);
        }

        if (parsedState.views) {
          // Merge saved view locations with default views
          const mergedViews = [...defaultViews];

          parsedState.views.forEach((savedView: Partial<ViewDescriptor>) => {
            const index = mergedViews.findIndex((v) => v.id === savedView.id);
            if (index !== -1 && savedView.containerLocation) {
              mergedViews[index] = {
                ...mergedViews[index],
                containerLocation: savedView.containerLocation,
              };
            }
          });

          setViews(mergedViews);
        }
      }
    } catch (error) {
      console.error('Error loading view state from localStorage:', error);
    }
  }, []);

  // Save view state to localStorage whenever it changes
  useEffect(() => {
    try {
      const viewState = {
        activeViewId,
        activeSecondaryViewId,
        views: views.map((view) => ({
          id: view.id,
          containerLocation: view.containerLocation,
        })),
      };

      localStorage.setItem('vscode-view-state', JSON.stringify(viewState));
    } catch (error) {
      console.error('Error saving view state to localStorage:', error);
    }
  }, [views, activeViewId, activeSecondaryViewId]);

  // Register a new view
  const registerView = (view: ViewDescriptor) => {
    setViews((prevViews) => {
      // Check if view already exists
      const existingIndex = prevViews.findIndex((v) => v.id === view.id);

      if (existingIndex !== -1) {
        // Update existing view
        const updatedViews = [...prevViews];
        updatedViews[existingIndex] = {
          ...updatedViews[existingIndex],
          ...view,
        };
        return updatedViews;
      } else {
        // Add new view
        return [...prevViews, view];
      }
    });
  };

  // Unregister a view
  const unregisterView = (id: string) => {
    setViews((prevViews) => prevViews.filter((view) => view.id !== id));
  };

  // Move a view to a different location
  const moveView = (
    id: string,
    location: 'primary-sidebar' | 'secondary-sidebar' | 'panel',
  ) => {
    setViews((prevViews) => {
      return prevViews.map((view) => {
        if (view.id === id) {
          return { ...view, containerLocation: location };
        }
        return view;
      });
    });
  };

  // Register a new activity bar item
  const registerActivityBarItem = (item: ActivityBarItem) => {
    setActivityBarItems((prevItems) => {
      // Check if item already exists
      const existingIndex = prevItems.findIndex((i) => i.id === item.id);

      if (existingIndex !== -1) {
        // Update existing item
        const updatedItems = [...prevItems];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          ...item,
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, item];
      }
    });
  };

  // Unregister an activity bar item
  const unregisterActivityBarItem = (id: string) => {
    setActivityBarItems((prevItems) =>
      prevItems.filter((item) => item.id !== id),
    );
  };

  const contextValue: ViewContextType = {
    views,
    activityBarItems,
    activeViewId,
    activeSecondaryViewId,
    setActiveViewId,
    setActiveSecondaryViewId,
    registerView,
    unregisterView,
    moveView,
    registerActivityBarItem,
    unregisterActivityBarItem,
  };

  return (
    <ViewContext.Provider value={contextValue}>{children}</ViewContext.Provider>
  );
};
