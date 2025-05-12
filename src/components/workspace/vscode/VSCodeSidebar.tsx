import React, { useState } from 'react';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { ViewProvider } from '@/contexts/ViewContext';
import { PanelProvider } from '@/contexts/PanelContext';
import { EditorProvider } from '@/contexts/EditorContext';
import { useViewContext } from '@/contexts/ViewContext';

interface VSCodeSidebarProps {
  componentState: {
    activeView: string;
  };
}

// Inner component that uses the context
const SidebarContent: React.FC<VSCodeSidebarProps> = ({ componentState }) => {
  const { views, setActiveViewId, activeViewId } = useViewContext();
  const [currentActiveView, setCurrentActiveView] = useState(
    componentState.activeView || 'explorer',
  );

  // Set active view when component mounts or when currentActiveView changes
  React.useEffect(() => {
    setActiveViewId(currentActiveView);
  }, [currentActiveView, setActiveViewId]);

  // Filter views that belong to primary sidebar
  const sidebarViews = views.filter(
    (view) =>
      view.containerLocation === 'primary-sidebar' ||
      (view.defaultLocation === 'primary-sidebar' && !view.containerLocation),
  );

  return (
    <div className="h-full flex flex-col bg-[#252526] text-[#cccccc]">
      {/* Sidebar Title */}
      <div className="sidebar-title h-10 flex items-center px-4 font-semibold border-b border-[#1e1e1e]">
        {activeViewId
          ? views.find((v) => v.id === activeViewId)?.name || 'EXPLORER'
          : 'EXPLORER'}
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-auto p-2">
        {activeViewId === 'explorer' && (
          <div>
            <div className="mb-4">
              <div className="font-semibold mb-2">OPEN EDITORS</div>
              <div className="pl-4">
                <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer">
                  main.js
                </div>
                <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer">
                  index.html
                </div>
                <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer">
                  styles.css
                </div>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-2">PROJECT</div>
              <div className="pl-4">
                <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer">
                  src/
                </div>
                <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer">
                  package.json
                </div>
                <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer">
                  README.md
                </div>
              </div>
            </div>
          </div>
        )}

        {activeViewId === 'search' && (
          <div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search"
                className="w-full p-1 bg-[#3c3c3c] text-[#cccccc] border border-[#1e1e1e] rounded"
              />
            </div>

            <div className="text-[#6c6c6c] text-center mt-8">
              Type to search
            </div>
          </div>
        )}

        {activeViewId === 'source-control' && (
          <div>
            <div className="mb-4 font-semibold">SOURCE CONTROL</div>

            <div className="text-[#6c6c6c] text-center mt-8">
              No changes detected
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper component that provides the context
const VSCodeSidebar: React.FC<VSCodeSidebarProps> = (props) => {
  return (
    <LayoutProvider>
      <ViewProvider>
        <EditorProvider>
          <PanelProvider>
            <SidebarContent {...props} />
          </PanelProvider>
        </EditorProvider>
      </ViewProvider>
    </LayoutProvider>
  );
};

export default VSCodeSidebar;
