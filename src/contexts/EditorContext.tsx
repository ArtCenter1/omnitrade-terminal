import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  EditorDescriptor,
  EditorGroupLayout,
  EditorLeafLayout,
} from '@/types/layout';

interface EditorContextType {
  editors: EditorDescriptor[];
  editorLayout: EditorGroupLayout;
  activeEditorId: string | null;
  activeEditorGroupId: string | null;
  openEditor: (editor: EditorDescriptor) => void;
  closeEditor: (id: string) => void;
  setActiveEditor: (id: string) => void;
  setActiveEditorGroup: (id: string) => void;
  updateEditor: (id: string, updates: Partial<EditorDescriptor>) => void;
  createEditorGroup: (
    direction: 'horizontal' | 'vertical',
    referenceGroupId?: string,
  ) => string;
  closeEditorGroup: (id: string) => void;
  moveEditorToGroup: (editorId: string, groupId: string) => void;
  updateEditorLayout: (layout: EditorGroupLayout) => void;
  pinEditor: (id: string, pinned: boolean) => void;
  setEditorDirty: (id: string, dirty: boolean) => void;
}

// Default editor layout with a single group
const defaultEditorLayout: EditorGroupLayout = {
  orientation: 'horizontal',
  groups: [
    {
      type: 'leaf',
      id: 'default-group',
      active: true,
    },
  ],
};

const defaultEditorContext: EditorContextType = {
  editors: [],
  editorLayout: defaultEditorLayout,
  activeEditorId: null,
  activeEditorGroupId: 'default-group',
  openEditor: () => {},
  closeEditor: () => {},
  setActiveEditor: () => {},
  setActiveEditorGroup: () => {},
  updateEditor: () => {},
  createEditorGroup: () => 'default-group',
  closeEditorGroup: () => {},
  moveEditorToGroup: () => {},
  updateEditorLayout: () => {},
  pinEditor: () => {},
  setEditorDirty: () => {},
};

const EditorContext = createContext<EditorContextType>(defaultEditorContext);

export const useEditorContext = () => useContext(EditorContext);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [editors, setEditors] = useState<EditorDescriptor[]>([]);
  const [editorLayout, setEditorLayout] =
    useState<EditorGroupLayout>(defaultEditorLayout);
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);
  const [activeEditorGroupId, setActiveEditorGroupId] = useState<string | null>(
    'default-group',
  );

  // Load saved editor state from localStorage on component mount
  useEffect(() => {
    try {
      const savedEditorState = localStorage.getItem('vscode-editor-state');
      if (savedEditorState) {
        const parsedState = JSON.parse(savedEditorState);

        if (parsedState.editors) {
          setEditors(parsedState.editors);
        }

        if (parsedState.editorLayout) {
          setEditorLayout(parsedState.editorLayout);
        }

        if (parsedState.activeEditorId) {
          setActiveEditorId(parsedState.activeEditorId);
        }

        if (parsedState.activeEditorGroupId) {
          setActiveEditorGroupId(parsedState.activeEditorGroupId);
        }
      }
    } catch (error) {
      console.error('Error loading editor state from localStorage:', error);
    }
  }, []);

  // Save editor state to localStorage whenever it changes
  useEffect(() => {
    try {
      const editorState = {
        editors,
        editorLayout,
        activeEditorId,
        activeEditorGroupId,
      };

      localStorage.setItem('vscode-editor-state', JSON.stringify(editorState));
    } catch (error) {
      console.error('Error saving editor state to localStorage:', error);
    }
  }, [editors, editorLayout, activeEditorId, activeEditorGroupId]);

  // Open a new editor or focus an existing one
  const openEditor = (editor: EditorDescriptor) => {
    setEditors((prevEditors) => {
      // Check if editor already exists
      const existingIndex = prevEditors.findIndex((e) => e.id === editor.id);

      if (existingIndex !== -1) {
        // Update existing editor
        const updatedEditors = [...prevEditors];
        updatedEditors[existingIndex] = {
          ...updatedEditors[existingIndex],
          ...editor,
        };
        return updatedEditors;
      } else {
        // Add new editor
        return [
          ...prevEditors,
          {
            ...editor,
            groupId: editor.groupId || activeEditorGroupId || 'default-group',
          },
        ];
      }
    });

    // Set as active editor
    setActiveEditorId(editor.id);

    // Set editor's group as active group
    if (editor.groupId) {
      setActiveEditorGroupId(editor.groupId);
    }
  };

  // Close an editor
  const closeEditor = (id: string) => {
    setEditors((prevEditors) => {
      const editorToClose = prevEditors.find((e) => e.id === id);
      const remainingEditors = prevEditors.filter((e) => e.id !== id);

      // If we're closing the active editor, set a new active editor
      if (activeEditorId === id && remainingEditors.length > 0) {
        // Find editors in the same group
        const groupEditors = remainingEditors.filter(
          (e) => e.groupId === editorToClose?.groupId,
        );

        if (groupEditors.length > 0) {
          // Set the first editor in the same group as active
          setActiveEditorId(groupEditors[0].id);
        } else {
          // Set the first editor as active
          setActiveEditorId(remainingEditors[0].id);
          setActiveEditorGroupId(
            remainingEditors[0].groupId || 'default-group',
          );
        }
      } else if (remainingEditors.length === 0) {
        // No editors left
        setActiveEditorId(null);
      }

      return remainingEditors;
    });
  };

  // Set active editor
  const setActiveEditor = (id: string) => {
    setActiveEditorId(id);

    // Also set the editor's group as active
    const editor = editors.find((e) => e.id === id);
    if (editor && editor.groupId) {
      setActiveEditorGroupId(editor.groupId);
    }
  };

  // Set active editor group
  const setActiveEditorGroup = (id: string) => {
    setActiveEditorGroupId(id);

    // Find the first editor in this group and set it as active
    const groupEditors = editors.filter((e) => e.groupId === id);
    if (groupEditors.length > 0) {
      setActiveEditorId(groupEditors[0].id);
    }
  };

  // Update an editor
  const updateEditor = (id: string, updates: Partial<EditorDescriptor>) => {
    setEditors((prevEditors) => {
      return prevEditors.map((editor) => {
        if (editor.id === id) {
          return { ...editor, ...updates };
        }
        return editor;
      });
    });
  };

  // Create a new editor group
  const createEditorGroup = (
    direction: 'horizontal' | 'vertical',
    referenceGroupId?: string,
  ) => {
    const newGroupId = `group-${Date.now()}`;

    setEditorLayout((prevLayout) => {
      // If no reference group is provided, split the active group
      const targetGroupId =
        referenceGroupId || activeEditorGroupId || 'default-group';

      // Helper function to recursively update the layout
      const updateLayoutGroups = (
        layout: EditorGroupLayout | EditorLeafLayout,
      ): EditorGroupLayout | EditorLeafLayout => {
        if ('type' in layout && layout.type === 'leaf') {
          // This is a leaf node (actual editor group)
          if (layout.id === targetGroupId) {
            // Create a new container with the target group and a new empty group
            return {
              orientation: direction,
              groups: [
                layout,
                {
                  type: 'leaf',
                  id: newGroupId,
                },
              ],
            };
          }
          return layout;
        } else {
          // This is a container node with child groups
          const groupLayout = layout as EditorGroupLayout;

          // Check if any child contains the target group
          let found = false;
          const updatedGroups = groupLayout.groups.map((group) => {
            const result = updateLayoutGroups(group);
            if (result !== group) {
              found = true;
            }
            return result;
          });

          if (found) {
            return {
              ...groupLayout,
              groups: updatedGroups,
            };
          }

          // If the target group wasn't found in any child, and this container
          // has the same orientation as the requested split, add the new group here
          if (groupLayout.orientation === direction) {
            return {
              ...groupLayout,
              groups: [
                ...groupLayout.groups,
                {
                  type: 'leaf',
                  id: newGroupId,
                },
              ],
            };
          }

          return groupLayout;
        }
      };

      return updateLayoutGroups(prevLayout) as EditorGroupLayout;
    });

    return newGroupId;
  };

  // Close an editor group
  const closeEditorGroup = (id: string) => {
    // Close all editors in the group
    setEditors((prevEditors) => {
      return prevEditors.filter((editor) => editor.groupId !== id);
    });

    // Remove the group from the layout
    setEditorLayout((prevLayout) => {
      // Helper function to recursively update the layout
      const updateLayoutGroups = (
        layout: EditorGroupLayout | EditorLeafLayout,
      ): EditorGroupLayout | EditorLeafLayout | null => {
        if ('type' in layout && layout.type === 'leaf') {
          // This is a leaf node (actual editor group)
          if (layout.id === id) {
            return null; // Remove this group
          }
          return layout;
        } else {
          // This is a container node with child groups
          const groupLayout = layout as EditorGroupLayout;

          // Filter out null results and update groups
          const updatedGroups = groupLayout.groups
            .map((group) => updateLayoutGroups(group))
            .filter((group) => group !== null) as Array<
            EditorGroupLayout | EditorLeafLayout
          >;

          // If there's only one child left, return that child
          if (updatedGroups.length === 1) {
            return updatedGroups[0];
          }

          // If no children left, return null
          if (updatedGroups.length === 0) {
            return null;
          }

          // Otherwise return the updated container
          return {
            ...groupLayout,
            groups: updatedGroups,
          };
        }
      };

      const updatedLayout = updateLayoutGroups(prevLayout);

      // If the entire layout was removed, return the default layout
      if (updatedLayout === null) {
        return defaultEditorLayout;
      }

      return updatedLayout as EditorGroupLayout;
    });

    // If the closed group was active, set a new active group
    if (activeEditorGroupId === id) {
      // Find the first available group
      const findFirstGroup = (
        layout: EditorGroupLayout | EditorLeafLayout,
      ): string | null => {
        if ('type' in layout && layout.type === 'leaf') {
          return layout.id || null;
        } else {
          const groupLayout = layout as EditorGroupLayout;
          for (const group of groupLayout.groups) {
            const groupId = findFirstGroup(group);
            if (groupId) {
              return groupId;
            }
          }
          return null;
        }
      };

      const firstGroupId = findFirstGroup(editorLayout) || 'default-group';
      setActiveEditorGroupId(firstGroupId);

      // Find the first editor in this group and set it as active
      const groupEditors = editors.filter((e) => e.groupId === firstGroupId);
      if (groupEditors.length > 0) {
        setActiveEditorId(groupEditors[0].id);
      } else {
        setActiveEditorId(null);
      }
    }
  };

  // Move an editor to a different group
  const moveEditorToGroup = (editorId: string, groupId: string) => {
    setEditors((prevEditors) => {
      return prevEditors.map((editor) => {
        if (editor.id === editorId) {
          return { ...editor, groupId };
        }
        return editor;
      });
    });

    // Set as active editor and group
    setActiveEditorId(editorId);
    setActiveEditorGroupId(groupId);
  };

  // Update the entire editor layout
  const updateEditorLayout = (layout: EditorGroupLayout) => {
    setEditorLayout(layout);
  };

  // Pin/unpin an editor
  const pinEditor = (id: string, pinned: boolean) => {
    updateEditor(id, { pinned });
  };

  // Set an editor as dirty/clean
  const setEditorDirty = (id: string, dirty: boolean) => {
    updateEditor(id, { dirty });
  };

  const contextValue: EditorContextType = {
    editors,
    editorLayout,
    activeEditorId,
    activeEditorGroupId,
    openEditor,
    closeEditor,
    setActiveEditor,
    setActiveEditorGroup: setActiveEditorGroupId,
    updateEditor,
    createEditorGroup,
    closeEditorGroup,
    moveEditorToGroup,
    updateEditorLayout,
    pinEditor,
    setEditorDirty,
  };

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
};
