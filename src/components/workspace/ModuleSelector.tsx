/**
 * Module Selector Component
 *
 * This component displays available modules that can be dragged and dropped
 * into the workspace. It's inspired by TabTrader's module selector.
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Info } from 'lucide-react';
import { componentRegistry } from '@/lib/component-registry';
import { ComponentMetadata } from '@/lib/component-registry/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ModuleSelectorProps {
  onClose: () => void;
  usageCounts?: Record<string, number>;
  anchorPosition?: {
    top: number;
    left: number;
  };
}

export function ModuleSelector({
  onClose,
  usageCounts = {},
  anchorPosition,
}: ModuleSelectorProps) {
  const [modules, setModules] = useState<ComponentMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load modules from the component registry
  useEffect(() => {
    const allModules = componentRegistry.getComponents();
    setModules(allModules);
  }, []);

  // Filter modules based on search query
  const filteredModules = modules.filter((module) => {
    const matchesSearch =
      searchQuery === '' ||
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Handle drag start
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    module: ComponentMetadata,
  ) => {
    console.log('Drag start:', module);

    // Set drag data
    const dragData = {
      type: 'module',
      moduleId: module.id,
      moduleName: module.name,
    };

    console.log('Setting drag data:', dragData);

    // Set the drag type as a custom format that can be detected during dragover
    e.dataTransfer.setData('application/omnitrade-module', module.id);

    // Also set as text/plain for compatibility
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));

    // Set drag effect
    e.dataTransfer.effectAllowed = 'move';

    // Set drag image (optional)
    const dragImage = document.createElement('div');
    dragImage.className = 'bg-theme-tertiary p-2 rounded shadow-lg';
    dragImage.textContent = module.name;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    // Clean up the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  // Use a ref to detect clicks outside the selector
  const selectorRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the selector
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Helper function to determine max instances
  const getMaxInstances = (module: ComponentMetadata): number => {
    const nameLower = module.name.toLowerCase();
    const idLower = module.id.toLowerCase();
    if (nameLower === 'watchlist' || idLower === 'watchlist') {
      return 10;
    }
    return 2;
  };

  return (
    <div
      className="fixed z-[9999] pointer-events-auto"
      style={{
        top: anchorPosition?.top || '60px',
        left: anchorPosition?.left || '20px',
        width: '400px',
        maxWidth: 'calc(100vw - 40px)',
      }}
    >
      <div
        ref={selectorRef}
        className="bg-theme-secondary border border-theme-border rounded-lg shadow-xl flex flex-col theme-transition max-h-[70vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-theme-border">
          <h2 className="text-base font-medium">Add Module</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-theme-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-muted h-4 w-4" />
            <Input
              placeholder="Search modules..."
              className="pl-10 bg-theme-tertiary border-theme-border h-8 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Module list */}
        <div className="overflow-y-auto p-3 flex-1">
          <div className="grid grid-cols-1 gap-3">
            {filteredModules.map((module) => {
              const currentUsage = usageCounts[module.id] || 0;
              const maxInstances = getMaxInstances(module);

              return (
                <div
                  key={module.id}
                  className="border border-theme-border rounded-lg p-3 cursor-move bg-theme-tertiary hover:bg-theme-hover transition-colors flex items-center gap-4"
                  draggable
                  onDragStart={(e) => handleDragStart(e, module)}
                >
                  {/* Left side: Text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className="font-semibold text-md text-theme-text-primary truncate">
                        {module.name}
                      </h3>
                      <span className="text-xs text-theme-muted flex-shrink-0">{`${currentUsage}/${maxInstances}`}</span>
                    </div>
                    {module.description && (
                      <p className="text-sm text-theme-text-secondary truncate">
                        {module.description}
                      </p>
                    )}
                  </div>

                  {/* Right side: Preview Snapshot Placeholder */}
                  <div
                    className="w-32 h-20 bg-theme-secondary border border-theme-border rounded flex items-center justify-center text-xs text-theme-muted flex-shrink-0"
                    aria-label={`${module.name} preview`} // Accessibility
                  >
                    Preview
                  </div>
                </div>
              );
            })}
          </div>

          {filteredModules.length === 0 && (
            <div className="text-center py-4 text-theme-muted">
              <p className="text-sm">No modules found.</p>
              <p className="text-xs mt-1">Try adjusting your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
