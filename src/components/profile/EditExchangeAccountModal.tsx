import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ExchangeApiKey,
  updateExchangeApiKey,
} from '@/services/exchangeApiKeyService';

interface EditExchangeAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: ExchangeApiKey | null;
  onSuccess?: () => void;
}

export function EditExchangeAccountModal({
  open,
  onOpenChange,
  apiKey,
  onSuccess,
}: EditExchangeAccountModalProps) {
  const [accountLabel, setAccountLabel] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when modal opens with new API key
  useEffect(() => {
    if (open && apiKey) {
      setAccountLabel(apiKey.key_nickname || '');
    }
  }, [open, apiKey]);

  const updateMutation = useMutation({
    mutationFn: (data: { apiKeyId: string; key_nickname: string }) =>
      updateExchangeApiKey(data.apiKeyId, { key_nickname: data.key_nickname }),
    onSuccess: () => {
      toast({
        title: 'Account updated',
        description: 'Your exchange account has been updated successfully.',
      });

      // Invalidate the exchangeApiKeys query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['exchangeApiKeys'] });

      // Invalidate any other queries that might depend on this data
      queryClient.invalidateQueries({ queryKey: ['portfolioData'] });

      // Clear the selected account from localStorage to force a refresh
      localStorage.removeItem('selected-account-storage');

      // Dispatch a storage event to notify other components
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'selected-account-storage',
        }),
      );

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update account',
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;

    updateMutation.mutate({
      apiKeyId: apiKey.api_key_id,
      key_nickname: accountLabel,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Exchange Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="exchange">Exchange</Label>
            <Input
              id="exchange"
              value={
                apiKey?.exchange_id.charAt(0).toUpperCase() +
                  apiKey?.exchange_id.slice(1) || ''
              }
              disabled
              className="bg-gray-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountLabel">Account Label</Label>
            <Input
              id="accountLabel"
              value={accountLabel}
              onChange={(e) => setAccountLabel(e.target.value)}
              placeholder="My Trading Account"
              required
              className="bg-gray-800"
            />
            <p className="text-xs text-gray-400">
              This label will be displayed in the account selector.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Account'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
