import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceTemplate } from '@/lib/workspace/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const {
    createWorkspace,
    createFromTemplate,
    setCurrentWorkspace,
    getTemplates,
  } = useWorkspace();
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  // Get all available templates and filter out VS Code Layout templates
  const templates = getTemplates().filter(
    (template) =>
      template.name !== 'VS Code Layout' && template.category !== 'hidden',
  );

  // Group templates by category
  const templatesByCategory = templates.reduce(
    (acc, template) => {
      const category = template.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    },
    {} as Record<string, WorkspaceTemplate[]>,
  );

  // Sort categories
  const categories = Object.keys(templatesByCategory).sort((a, b) => {
    // Put 'development' category first if it exists (for VS Code template)
    if (a === 'development') return -1;
    if (b === 'development') return 1;
    return a.localeCompare(b);
  });

  const handleCreateEmptyWorkspace = () => {
    if (!newWorkspaceName) return;

    const workspace = createWorkspace(
      newWorkspaceName,
      newWorkspaceDescription,
    );
    setCurrentWorkspace(workspace.id);
    resetForm();
  };

  const handleCreateFromTemplate = (templateId: string) => {
    if (!newWorkspaceName) return;

    const workspace = createFromTemplate(templateId, newWorkspaceName);
    if (workspace) {
      setCurrentWorkspace(workspace.id);
      resetForm();
    }
  };

  const resetForm = () => {
    setNewWorkspaceName('');
    setNewWorkspaceDescription('');
    setSelectedTemplateId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">From Template</TabsTrigger>
            <TabsTrigger value="empty">Empty Workspace</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Workspace Name</Label>
              <Input
                id="template-name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="My Workspace"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Template</Label>
              <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2">
                {categories.map((category) => (
                  <div key={category} className="space-y-2">
                    <h3 className="text-sm font-medium">{category}</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {templatesByCategory[category].map((template) => (
                        <Card
                          key={template.id}
                          className={`cursor-pointer border-2 ${selectedTemplateId === template.id ? 'border-primary' : 'border-border'}`}
                          onClick={() => setSelectedTemplateId(template.id)}
                        >
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base">
                              {template.name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {template.description}
                            </CardDescription>
                          </CardHeader>
                          <CardFooter className="p-4 pt-2 flex justify-between">
                            <div className="flex flex-wrap gap-1">
                              {template.tags?.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-muted px-1.5 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() =>
                selectedTemplateId &&
                handleCreateFromTemplate(selectedTemplateId)
              }
              disabled={!newWorkspaceName || !selectedTemplateId}
              className="w-full"
            >
              Create From Template
            </Button>
          </TabsContent>

          <TabsContent value="empty" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="empty-name">Name</Label>
              <Input
                id="empty-name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="My Workspace"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                placeholder="Description of this workspace"
              />
            </div>
            <Button
              onClick={handleCreateEmptyWorkspace}
              disabled={!newWorkspaceName}
              className="w-full"
            >
              Create Empty Workspace
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
