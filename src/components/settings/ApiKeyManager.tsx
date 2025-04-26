// src/components/settings/ApiKeyManager.tsx
import { useState } from 'react';
import { useApiKeys } from '@/hooks/useApiKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Star, StarOff, Plus, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ApiKeyPair } from '@/services/apiKeys/apiKeyManager';

interface ApiKeyManagerProps {
  exchangeId: string;
  title?: string;
  description?: string;
}

/**
 * Component for managing API keys
 */
export function ApiKeyManager({
  exchangeId,
  title = 'API Keys',
  description = 'Manage your API keys for this exchange',
}: ApiKeyManagerProps) {
  const {
    apiKeys,
    defaultKey,
    loading,
    error,
    addApiKey,
    deleteApiKey,
    setAsDefault,
    loadApiKeys,
    hasKeys,
  } = useApiKeys(exchangeId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiSecret, setNewApiSecret] = useState('');
  const [newApiKeyLabel, setNewApiKeyLabel] = useState('');
  const [isTestnet, setIsTestnet] = useState(true);
  const [makeDefault, setMakeDefault] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!newApiKey.trim()) {
        setAddError('API Key is required');
        return;
      }

      if (!newApiSecret.trim()) {
        setAddError('API Secret is required');
        return;
      }

      if (!newApiKeyLabel.trim()) {
        setAddError('Label is required');
        return;
      }

      // Add the API key
      const id = await addApiKey(
        newApiKey,
        newApiSecret,
        newApiKeyLabel,
        isTestnet,
        makeDefault || !hasKeys // Make default if it's the first key
      );

      if (id) {
        setAddSuccess('API key added successfully');
        
        // Reset form
        setNewApiKey('');
        setNewApiSecret('');
        setNewApiKeyLabel('');
        setIsTestnet(true);
        setMakeDefault(false);
        
        // Close dialog after a short delay
        setTimeout(() => {
          setIsAddDialogOpen(false);
          setAddSuccess(null);
        }, 1500);
      } else {
        setAddError('Failed to add API key');
      }
    } catch (err) {
      console.error('Error adding API key:', err);
      setAddError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this API key?')) {
      await deleteApiKey(id);
    }
  };

  // Handle set as default
  const handleSetAsDefault = async (id: string) => {
    await setAsDefault(id);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-4">Loading API keys...</div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No API keys found. Add one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {key.label}
                      {key.isDefault && (
                        <Badge variant="secondary" className="ml-2">
                          Default
                        </Badge>
                      )}
                      {key.isTestnet && (
                        <Badge variant="outline" className="ml-2">
                          Testnet
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      {key.apiKey.substring(0, 8)}...
                    </code>
                  </TableCell>
                  <TableCell>{formatDate(key.createdAt)}</TableCell>
                  <TableCell>
                    {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!key.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetAsDefault(key.id)}
                          title="Set as default"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(key.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add API Key</DialogTitle>
              <DialogDescription>
                Add a new API key for {exchangeId === 'binance_testnet' ? 'Binance Testnet' : exchangeId}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              {addError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{addError}</AlertDescription>
                </Alert>
              )}

              {addSuccess && (
                <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{addSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={newApiKeyLabel}
                    onChange={(e) => setNewApiKeyLabel(e.target.value)}
                    placeholder="My API Key"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder="Enter your API key"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={newApiSecret}
                    onChange={(e) => setNewApiSecret(e.target.value)}
                    placeholder="Enter your API secret"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isTestnet"
                    checked={isTestnet}
                    onCheckedChange={setIsTestnet}
                  />
                  <Label htmlFor="isTestnet">This is a testnet API key</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="makeDefault"
                    checked={makeDefault}
                    onCheckedChange={setMakeDefault}
                  />
                  <Label htmlFor="makeDefault">Make this the default API key</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add API Key'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
