import React, { useState, useEffect } from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { useEditorContext } from '@/contexts/EditorContext';
import EditorGroup from '../editor/EditorGroup';
import EditorTabs from '../editor/EditorTabs';
import Panel from './Panel';
import { EditorGroupLayout, EditorLeafLayout } from '@/types/layout';

const EditorPart: React.FC = () => {
  const {
    editorTabsMode,
    showEditorTabs,
    centeredLayout,
    panelVisible,
    panelPosition,
    panelMaximized,
  } = useLayoutContext();

  const {
    editorLayout,
    activeEditorGroupId,
    setActiveEditorGroupId,
    createEditorGroup,
    closeEditorGroup,
  } = useEditorContext();

  // State for tracking resize operations
  const [isResizing, setIsResizing] = useState(false);
  const [resizingEdge, setResizingEdge] = useState<string | null>(null);

  // Determine editor part classes
  const getEditorPartClasses = () => {
    const baseClasses = [
      'editor-part',
      'flex-1',
      'bg-[#1e1e1e]',
      'flex',
      'flex-col',
      'overflow-hidden',
    ];

    if (centeredLayout) {
      baseClasses.push('centered-layout');
    }

    return baseClasses.join(' ');
  };

  // Determine editor area classes
  const getEditorAreaClasses = () => {
    const baseClasses = ['editor-area', 'flex-1', 'flex', 'overflow-hidden'];

    if (panelVisible && panelPosition === 'within-editor' && panelMaximized) {
      baseClasses.push('hidden');
    }

    return baseClasses.join(' ');
  };

  // Handle start of resize operation
  const handleResizeStart = (edge: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingEdge(edge);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // Implement resize logic based on edge and mouse position
      // This would update the sizes in the editor layout
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingEdge(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Recursively render editor groups based on layout
  const renderEditorGroups = (
    layout: EditorGroupLayout | EditorLeafLayout,
    parentId?: string,
  ) => {
    if ('type' in layout && layout.type === 'leaf') {
      // This is a leaf node (actual editor group)
      return (
        <EditorGroup
          key={layout.id || 'default-group'}
          id={layout.id || 'default-group'}
          active={
            layout.active ||
            activeEditorGroupId === (layout.id || 'default-group')
          }
          size={layout.size}
          onActivate={() =>
            setActiveEditorGroupId(layout.id || 'default-group')
          }
          onClose={() => closeEditorGroup(layout.id || 'default-group')}
        />
      );
    } else {
      // This is a container node with child groups
      const groupLayout = layout as EditorGroupLayout;
      const isHorizontal = groupLayout.orientation === 'horizontal';

      return (
        <div
          className={`editor-group-container flex ${isHorizontal ? 'flex-row' : 'flex-col'} overflow-hidden`}
          style={{ flex: layout.size || 1 }}
        >
          {groupLayout.groups.map((group, index) => {
            const isLast = index === groupLayout.groups.length - 1;

            return (
              <React.Fragment key={`group-${index}`}>
                {renderEditorGroups(group, groupLayout.id)}

                {!isLast && (
                  <div
                    className={`resizer ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'} bg-[#1e1e1e] hover:bg-[#007acc]`}
                    onMouseDown={(e) =>
                      handleResizeStart(`${groupLayout.id}-${index}`, e)
                    }
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      );
    }
  };

  // Default layout if none exists
  const defaultLayout: EditorGroupLayout = {
    orientation: 'horizontal',
    groups: [
      {
        type: 'leaf',
        id: 'default-group',
        active: true,
        size: 1,
      },
    ],
  };

  return (
    <div className={getEditorPartClasses()}>
      <div className={getEditorAreaClasses()}>
        {renderEditorGroups(editorLayout || defaultLayout)}
      </div>

      {/* Panel within editor if configured that way */}
      {panelVisible && panelPosition === 'within-editor' && (
        <Panel position="within-editor" maximized={panelMaximized} />
      )}
    </div>
  );
};

export default EditorPart;
