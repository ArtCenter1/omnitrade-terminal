import React from 'react';
import { EditorDescriptor } from '@/types/layout';

interface EditorContentProps {
  editor: EditorDescriptor;
}

const EditorContent: React.FC<EditorContentProps> = ({ editor }) => {
  // This is a placeholder component that would render the actual editor content
  // In a real implementation, this would render different editor types based on the editor.type

  return (
    <div className="editor-content-container h-full bg-[#1e1e1e] text-[#d4d4d4] overflow-auto">
      {/* Placeholder content */}
      <div className="p-4">
        <h2 className="text-xl mb-4">{editor.title}</h2>
        <p className="mb-2">Editor ID: {editor.id}</p>
        <p className="mb-2">Editor Type: {editor.type}</p>
        <p className="mb-2">Group ID: {editor.groupId}</p>

        {/* This would be replaced with the actual editor component */}
        <div className="mt-4 p-4 bg-[#252526] rounded">
          <p className="text-[#6c6c6c] italic">
            This is a placeholder for the actual editor content. In a real
            implementation, different editor types would be rendered here based
            on the editor.type property.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditorContent;
