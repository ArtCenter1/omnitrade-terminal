import React, { createContext, useContext, useState, useEffect } from 'react';
import { PanelDescriptor } from '@/types/layout';

// Default panels
const defaultPanels: PanelDescriptor[] = [
  {
    id: 'problems',
    name: 'Problems',
    icon: 'icon-problems',
    order: 1,
    defaultLocation: 'panel',
    canMove: true,
    canClose: false,
  },
  {
    id: 'output',
    name: 'Output',
    icon: 'icon-output',
    order: 2,
    defaultLocation: 'panel',
    canMove: true,
    canClose: false,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: 'icon-terminal',
    order: 3,
    defaultLocation: 'panel',
    canMove: true,
    canClose: false,
  },
  {
    id: 'debug-console',
    name: 'Debug Console',
    icon: 'icon-debug-console',
    order: 4,
    defaultLocation: 'panel',
    canMove: true,
    canClose: false,
  },
];

interface PanelContextType {
  panels: PanelDescriptor[];
  activePanelId: string | null;
  setActivePanelId: (id: string | null) => void;
  registerPanel: (panel: PanelDescriptor) => void;
  unregisterPanel: (id: string) => void;
  movePanel: (
    id: string,
    location: 'panel' | 'primary-sidebar' | 'secondary-sidebar',
  ) => void;
}

const defaultPanelContext: PanelContextType = {
  panels: defaultPanels,
  activePanelId: 'terminal',
  setActivePanelId: () => {},
  registerPanel: () => {},
  unregisterPanel: () => {},
  movePanel: () => {},
};

const PanelContext = createContext<PanelContextType>(defaultPanelContext);

export const usePanelContext = () => useContext(PanelContext);

export const PanelProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [panels, setPanels] = useState<PanelDescriptor[]>(defaultPanels);
  const [activePanelId, setActivePanelId] = useState<string | null>('terminal');

  // Load saved panel state from localStorage on component mount
  useEffect(() => {
    try {
      const savedPanelState = localStorage.getItem('vscode-panel-state');
      if (savedPanelState) {
        const parsedState = JSON.parse(savedPanelState);

        if (parsedState.activePanelId) {
          setActivePanelId(parsedState.activePanelId);
        }

        if (parsedState.panels) {
          // Merge saved panel locations with default panels
          const mergedPanels = [...defaultPanels];

          parsedState.panels.forEach((savedPanel: Partial<PanelDescriptor>) => {
            const index = mergedPanels.findIndex((p) => p.id === savedPanel.id);
            if (index !== -1 && savedPanel.defaultLocation) {
              mergedPanels[index] = {
                ...mergedPanels[index],
                defaultLocation: savedPanel.defaultLocation,
              };
            }
          });

          setPanels(mergedPanels);
        }
      }
    } catch (error) {
      console.error('Error loading panel state from localStorage:', error);
    }
  }, []);

  // Save panel state to localStorage whenever it changes
  useEffect(() => {
    try {
      const panelState = {
        activePanelId,
        panels: panels.map((panel) => ({
          id: panel.id,
          defaultLocation: panel.defaultLocation,
        })),
      };

      localStorage.setItem('vscode-panel-state', JSON.stringify(panelState));
    } catch (error) {
      console.error('Error saving panel state to localStorage:', error);
    }
  }, [panels, activePanelId]);

  // Register a new panel
  const registerPanel = (panel: PanelDescriptor) => {
    setPanels((prevPanels) => {
      // Check if panel already exists
      const existingIndex = prevPanels.findIndex((p) => p.id === panel.id);

      if (existingIndex !== -1) {
        // Update existing panel
        const updatedPanels = [...prevPanels];
        updatedPanels[existingIndex] = {
          ...updatedPanels[existingIndex],
          ...panel,
        };
        return updatedPanels;
      } else {
        // Add new panel
        return [...prevPanels, panel];
      }
    });
  };

  // Unregister a panel
  const unregisterPanel = (id: string) => {
    setPanels((prevPanels) => prevPanels.filter((panel) => panel.id !== id));

    // If the active panel is being unregistered, set a new active panel
    if (activePanelId === id) {
      const remainingPanels = panels.filter((panel) => panel.id !== id);
      if (remainingPanels.length > 0) {
        setActivePanelId(remainingPanels[0].id);
      } else {
        setActivePanelId(null);
      }
    }
  };

  // Move a panel to a different location
  const movePanel = (
    id: string,
    location: 'panel' | 'primary-sidebar' | 'secondary-sidebar',
  ) => {
    setPanels((prevPanels) => {
      return prevPanels.map((panel) => {
        if (panel.id === id) {
          return { ...panel, defaultLocation: location };
        }
        return panel;
      });
    });
  };

  const contextValue: PanelContextType = {
    panels,
    activePanelId,
    setActivePanelId,
    registerPanel,
    unregisterPanel,
    movePanel,
  };

  return (
    <PanelContext.Provider value={contextValue}>
      {children}
    </PanelContext.Provider>
  );
};
