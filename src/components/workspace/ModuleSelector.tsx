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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ModuleSelectorProps {
  onClose: () => void;
  usageCounts?: Record<string, number>;
  anchorPosition?: {
    top: number;
    left: number;
  };
}

export function ModuleSelector({ onClose, usageCounts = {}, anchorPosition }: ModuleSelectorProps) {
  const [modules, setModules] = useState<ComponentMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load modules from the component registry
  useEffect(() => {
    const allModules = componentRegistry.getComponents();
    setModules(allModules);

    // Extract unique categories
    const uniqueCategories = Array.from(
      new Set(allModules.map(module => module.category).filter(Boolean))
    ) as string[];
    setCategories(uniqueCategories);

    // Set default category if available
    if (uniqueCategories.length > 0) {
      setSelectedCategory(uniqueCategories[0]);
    }
  }, []);

  // Filter modules based on search query and selected category
  const filteredModules = modules.filter(module => {
    const matchesSearch =
      searchQuery === '' ||
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory ||
      module.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, module: ComponentMetadata) => {
    console.log('Drag start:', module);

    // Set drag data
    const dragData = {
      type: 'module',
      moduleId: module.id,
      moduleName: module.name
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
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      className="fixed z-[9999] pointer-events-auto"
      style={{
        top: anchorPosition?.top || '60px',
        left: anchorPosition?.left || '20px',
        width: '400px',
        maxWidth: 'calc(100vw - 40px)'
      }}
    >
      <div
        ref={selectorRef}
        className="bg-theme-secondary border border-theme-border rounded-lg shadow-xl flex flex-col theme-transition max-h-[70vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-theme-border">
          <h2 className="text-base font-medium">Add Module</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
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

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex overflow-x-auto border-b border-theme-border">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none border-b-2 px-4 ${selectedCategory === null ? 'border-theme-accent' : 'border-transparent'}`}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                className={`rounded-none border-b-2 px-4 ${selectedCategory === category ? 'border-theme-accent' : 'border-transparent'}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        {/* Module list */}
        <div className="overflow-y-auto p-2 flex-1">
          <div className="grid grid-cols-1 gap-2">
            {filteredModules.map(module => (
              <div
                key={module.id}
                className="border border-theme-border rounded p-2 cursor-move bg-theme-tertiary hover:bg-theme-hover transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, module)}
              >
                <div className="flex items-center gap-3">
                  {/* Module icon */}
                  <div className="w-8 h-8 rounded bg-theme-accent flex items-center justify-center flex-shrink-0">
                    {module.icon ? (
                      <img src={module.icon} alt={module.name} className="w-5 h-5" />
                    ) : (
                      <div className="text-xs text-center">{module.name.substring(0, 2).toUpperCase()}</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{module.name}</h3>
                    {module.description && (
                      <p className="text-xs text-theme-muted truncate">
                        {module.description}
                      </p>
                    )}
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">Drag to add to workspace</p>
                        {usageCounts[module.id] ? (
                          <p className="text-xs">Used {usageCounts[module.id]} times</p>
                        ) : (
                          <p className="text-xs">Not used yet</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
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
