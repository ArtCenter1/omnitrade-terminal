import React, { useState } from 'react';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { ViewProvider } from '@/contexts/ViewContext';
import { PanelProvider } from '@/contexts/PanelContext';
import { EditorProvider } from '@/contexts/EditorContext';
import { useViewContext } from '@/contexts/ViewContext';

interface VSCodeSecondaryBarProps {
  componentState: {
    activeView: string;
  };
}

// Inner component that uses the context
const SecondaryBarContent: React.FC<VSCodeSecondaryBarProps> = ({
  componentState,
}) => {
  const { views, setActiveSecondaryViewId, activeSecondaryViewId } =
    useViewContext();
  const [currentActiveView, setCurrentActiveView] = useState(
    componentState.activeView || 'outline',
  );

  // Set active view when component mounts or when currentActiveView changes
  React.useEffect(() => {
    setActiveSecondaryViewId(currentActiveView);
  }, [currentActiveView, setActiveSecondaryViewId]);

  // Filter views that belong to secondary sidebar
  const sidebarViews = views.filter(
    (view) =>
      view.containerLocation === 'secondary-sidebar' ||
      (view.defaultLocation === 'secondary-sidebar' && !view.containerLocation),
  );

  return (
    <div className="h-full flex flex-col bg-[#252526] text-[#cccccc]">
      {/* Sidebar Title */}
      <div className="sidebar-title h-10 flex items-center px-4 font-semibold border-b border-[#1e1e1e]">
        {activeSecondaryViewId
          ? views.find((v) => v.id === activeSecondaryViewId)?.name || 'OUTLINE'
          : 'OUTLINE'}
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-auto p-2">
        {activeSecondaryViewId === 'outline' && (
          <div>
            <div className="mb-4 font-semibold">OUTLINE</div>

            <div className="pl-4">
              <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer">
                function main()
              </div>
              <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer ml-4">
                const data
              </div>
              <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer ml-4">
                if statement
              </div>
              <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer">
                class Component
              </div>
              <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer ml-4">
                constructor()
              </div>
              <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer ml-4">
                render()
              </div>
            </div>
          </div>
        )}

        {activeSecondaryViewId === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto mb-4">
              <div className="p-2 mb-2 bg-[#2a2d2e] rounded">
                <div className="font-semibold mb-1">User</div>
                <div>How do I create a new file?</div>
              </div>

              <div className="p-2 mb-2 bg-[#252526] rounded">
                <div className="font-semibold mb-1">Assistant</div>
                <div>
                  You can create a new file by using the File menu and selecting
                  New File, or by using the keyboard shortcut Ctrl+N (Cmd+N on
                  macOS).
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <input
                type="text"
                placeholder="Ask a question..."
                className="w-full p-2 bg-[#3c3c3c] text-[#cccccc] border border-[#1e1e1e] rounded"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper component that provides the context
const VSCodeSecondaryBar: React.FC<VSCodeSecondaryBarProps> = (props) => {
  return (
    <LayoutProvider>
      <ViewProvider>
        <EditorProvider>
          <PanelProvider>
            <SecondaryBarContent {...props} />
          </PanelProvider>
        </EditorProvider>
      </ViewProvider>
    </LayoutProvider>
  );
};

export default VSCodeSecondaryBar;
