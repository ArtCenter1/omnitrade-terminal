import React from 'react';
import { useViewContext } from '@/contexts/ViewContext';

interface ViewContainerProps {
  viewId: string;
}

const ViewContainer: React.FC<ViewContainerProps> = ({ viewId }) => {
  const { views } = useViewContext();

  // Find the view
  const view = views.find((v) => v.id === viewId);

  if (!view) {
    return (
      <div className="view-container p-4 text-[#6c6c6c]">
        View not found: {viewId}
      </div>
    );
  }

  // Render different content based on view ID
  const renderViewContent = () => {
    switch (viewId) {
      case 'explorer':
        return (
          <div className="p-2">
            <div className="mb-4">
              <div className="font-semibold mb-2">OPEN EDITORS</div>
              <div className="pl-4">
                <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer">
                  file1.ts
                </div>
                <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer">
                  file2.ts
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
        );

      case 'search':
        return (
          <div className="p-2">
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
        );

      case 'source-control':
        return (
          <div className="p-2">
            <div className="mb-4 font-semibold">SOURCE CONTROL</div>

            <div className="text-[#6c6c6c] text-center mt-8">
              No changes detected
            </div>
          </div>
        );

      case 'debug':
        return (
          <div className="p-2">
            <div className="mb-4 font-semibold">RUN AND DEBUG</div>

            <div className="text-[#6c6c6c] text-center mt-8">
              No active debug session
            </div>
          </div>
        );

      case 'extensions':
        return (
          <div className="p-2">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search Extensions"
                className="w-full p-1 bg-[#3c3c3c] text-[#cccccc] border border-[#1e1e1e] rounded"
              />
            </div>

            <div className="mb-4 font-semibold">INSTALLED</div>
            <div className="pl-4">
              <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer">
                Extension 1
              </div>
              <div className="py-1 hover:bg-[#2a2d2e] cursor-pointer">
                Extension 2
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="p-2 flex flex-col h-full">
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
        );

      case 'outline':
        return (
          <div className="p-2">
            <div className="mb-4 font-semibold">OUTLINE</div>

            <div className="text-[#6c6c6c] text-center mt-8">
              No symbols found in the active editor
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4">
            <h3 className="text-lg mb-2">View: {view.name}</h3>
            <p className="text-[#6c6c6c]">
              This is a placeholder for the view content.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="view-container h-full bg-[#252526] text-[#d4d4d4] overflow-auto">
      {renderViewContent()}
    </div>
  );
};

export default ViewContainer;
