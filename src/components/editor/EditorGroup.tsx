import React from 'react';
import { useEditorContext } from '@/contexts/EditorContext';
import EditorTabs from './EditorTabs';
import EditorContent from './EditorContent';

interface EditorGroupProps {
  id: string;
  active: boolean;
  size?: number;
  onActivate: () => void;
  onClose: () => void;
}

const EditorGroup: React.FC<EditorGroupProps> = ({
  id,
  active,
  size,
  onActivate,
  onClose,
}) => {
  const { editors, activeEditorId } = useEditorContext();

  // Filter editors that belong to this group
  const groupEditors = editors.filter((editor) => editor.groupId === id);

  // Get active editor in this group
  const activeEditor =
    groupEditors.find((editor) => editor.id === activeEditorId) ||
    groupEditors[0];

  // Handle click on the editor group
  const handleClick = () => {
    onActivate();
  };

  return (
    <div
      className={`editor-group flex flex-col overflow-hidden ${active ? 'active' : ''}`}
      style={{ flex: size || 1 }}
      onClick={handleClick}
    >
      {/* Editor Tabs */}
      <EditorTabs groupId={id} />

      {/* Editor Content */}
      <div className="editor-content flex-1 overflow-hidden">
        {activeEditor ? (
          <EditorContent editor={activeEditor} />
        ) : (
          <div className="empty-editor flex items-center justify-center h-full text-[#6c6c6c]">
            No editor open
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorGroup;
