import React, { useState, useRef } from 'react';
import { useEditorContext } from '@/contexts/EditorContext';
import { useLayoutContext } from '@/contexts/LayoutContext';

interface EditorTabsProps {
  groupId: string;
}

const EditorTabs: React.FC<EditorTabsProps> = ({ groupId }) => {
  const { editors, activeEditorId, setActiveEditor, closeEditor, pinEditor } =
    useEditorContext();
  const { editorTabsMode, showEditorTabs } = useLayoutContext();

  const [isDragging, setIsDragging] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Filter editors that belong to this group
  const groupEditors = editors.filter((editor) => editor.groupId === groupId);

  // Sort editors: pinned first, then by most recently used
  const sortedEditors = [...groupEditors].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  // If not showing tabs or no editors, return null
  if (
    !showEditorTabs ||
    editorTabsMode === 'none' ||
    (editorTabsMode === 'single' && !activeEditorId)
  ) {
    return null;
  }

  // If showing single tab mode, only show the active editor
  const displayedEditors =
    editorTabsMode === 'single'
      ? sortedEditors.filter((editor) => editor.id === activeEditorId)
      : sortedEditors;

  // Handle tab click
  const handleTabClick = (editorId: string) => {
    setActiveEditor(editorId);
  };

  // Handle tab close
  const handleTabClose = (e: React.MouseEvent, editorId: string) => {
    e.stopPropagation();
    closeEditor(editorId);
  };

  // Handle tab pin/unpin
  const handleTabPin = (
    e: React.MouseEvent,
    editorId: string,
    isPinned: boolean,
  ) => {
    e.stopPropagation();
    pinEditor(editorId, !isPinned);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, editorId: string) => {
    setIsDragging(true);
    setDraggedTabId(editorId);
    e.dataTransfer.setData('text/plain', editorId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedTabId(null);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetEditorId: string) => {
    e.preventDefault();

    if (!draggedTabId || draggedTabId === targetEditorId) {
      return;
    }

    // Reorder editors (would need to implement this in the context)
    console.log(`Reorder: ${draggedTabId} to position of ${targetEditorId}`);

    setIsDragging(false);
    setDraggedTabId(null);
  };

  return (
    <div
      className="editor-tabs flex h-10 bg-[#252526] border-b border-[#1e1e1e] overflow-x-auto"
      ref={tabsRef}
    >
      {displayedEditors.map((editor) => (
        <div
          key={editor.id}
          className={`editor-tab flex items-center px-3 h-full cursor-pointer border-r border-[#1e1e1e] ${
            editor.id === activeEditorId
              ? 'active bg-[#1e1e1e]'
              : 'hover:bg-[#2a2d2e]'
          } ${editor.pinned ? 'pinned' : ''}`}
          onClick={() => handleTabClick(editor.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, editor.id)}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDrop={(e) => handleDrop(e, editor.id)}
        >
          {/* Editor Icon */}
          {editor.icon && (
            <span className={`editor-icon mr-2 ${editor.icon}`}></span>
          )}

          {/* Editor Title */}
          <span className="editor-title truncate">{editor.title}</span>

          {/* Dirty Indicator */}
          {editor.dirty && (
            <span className="dirty-indicator ml-2 w-2 h-2 rounded-full bg-[#007acc]"></span>
          )}

          {/* Tab Actions */}
          <div className="tab-actions ml-2 flex items-center">
            {/* Pin/Unpin Button */}
            <button
              className="p-1 hover:bg-[#3c3c3c] rounded opacity-0 group-hover:opacity-100"
              onClick={(e) => handleTabPin(e, editor.id, !!editor.pinned)}
              title={editor.pinned ? 'Unpin' : 'Pin'}
            >
              <i
                className={`icon ${editor.pinned ? 'icon-pinned' : 'icon-pin'}`}
              ></i>
            </button>

            {/* Close Button */}
            <button
              className="p-1 hover:bg-[#3c3c3c] rounded opacity-0 group-hover:opacity-100"
              onClick={(e) => handleTabClose(e, editor.id)}
              title="Close"
            >
              <i className="icon icon-close"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EditorTabs;
