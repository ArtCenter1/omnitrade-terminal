import { useState } from 'react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { AddExchangeAccountModal } from '@/components/profile/AddExchangeAccountModal';
import {
  listExchangeApiKeys,
  deleteExchangeApiKey,
  ExchangeApiKey,
} from '@/services/exchangeApiKeyService';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MyAccounts() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exchange API keys
  const {
    data: apiKeys,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['exchangeApiKeys'],
    queryFn: listExchangeApiKeys,
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: deleteExchangeApiKey,
    onSuccess: () => {
      toast({
        title: 'Exchange account removed',
        description: 'The exchange account has been successfully removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['exchangeApiKeys'] });
      setDeleteKeyId(null); // Close the confirmation dialog
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove exchange account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deleteKeyId) {
      deleteKeyMutation.mutate(deleteKeyId);
    }
  };

  // Get exchange name from ID
  const getExchangeName = (exchangeId: string): string => {
    try {
      // In a real implementation, you'd want to fetch exchange info ahead of time
      // and store it in state, since getExchangeInfo returns a Promise
      // For now, we'll just format the exchange ID
      return exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1);
    } catch (error) {
      return exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1);
    }
  };

  // Format date string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ProfileLayout title="My Accounts">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Exchange Accounts</h2>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} className="mr-1" />
            Add Exchange
          </Button>
        </div>

        {isLoading ? (
          <div className="bg-gray-800 rounded-lg p-6 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-400">
              Loading exchange accounts...
            </span>
          </div>
        ) : isError ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-gray-400 mb-4">
              Error loading exchange accounts:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        ) : apiKeys && apiKeys.length > 0 ? (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Exchange
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Added On
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {apiKeys.map((apiKey: ExchangeApiKey) => (
                    <tr key={apiKey.api_key_id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="font-medium">
                            {getExchangeName(apiKey.exchange_id)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-300">
                          {apiKey.key_nickname || apiKey.exchange_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${apiKey.is_valid ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}
                        >
                          {apiKey.is_valid ? 'Valid' : 'Invalid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                        {formatDate(apiKey.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => setDeleteKeyId(apiKey.api_key_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-4">
              You haven't connected any exchanges yet.
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Connect your first exchange to start trading, tracking balances,
              and creating automated strategies.
            </p>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={16} className="mr-1" />
              Add Exchange
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center mt-10">
          <h2 className="text-xl font-medium">Wallet Accounts</h2>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400 mb-4">
            You haven't connected any wallets yet.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Connect your wallet to track your assets and make
            deposits/withdrawals.
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus size={16} className="mr-1" />
            Add Wallet
          </Button>
        </div>
      </div>

      {/* Add Exchange Modal */}
      <AddExchangeAccountModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ['exchangeApiKeys'] })
        }
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteKeyId}
        onOpenChange={(open) => !open && setDeleteKeyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this exchange account and all
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteKeyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProfileLayout>
  );
}
