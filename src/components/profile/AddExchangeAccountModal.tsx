import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  addExchangeApiKey,
  testExchangeApiKey,
} from '@/services/exchangeApiKeyService';
import { ExchangeFactory } from '@/services/exchange/exchangeFactory';
import { useToast } from '@/components/ui/use-toast';
import ConnectionSuccessModal from './ConnectionSuccessModal'; // Import the new success modal
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define expected response types
interface AddApiKeyResponse {
  api_key_id: string;
  // Add other potential properties from the add response if needed
}

interface TestApiKeyResponse {
  success: boolean;
  message: string;
}

interface AddExchangeAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // Optional callback for successful connection, e.g., to refetch accounts
}

export function AddExchangeAccountModal({
  open,
  onOpenChange,
  onSuccess,
}: AddExchangeAccountModalProps) {
  // Placeholder state and handlers - actual logic not required for this task
  const [selectedExchange, setSelectedExchange] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [accountLabel, setAccountLabel] = useState('');
  const { toast } = useToast();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // State for success modal

  // Fetch supported exchanges
  const { data: supportedExchanges, isLoading: isLoadingExchanges } = useQuery({
    queryKey: ['supportedExchanges'],
    queryFn: async () => {
      // Get the list of supported exchanges from the factory
      const exchangeIds = ExchangeFactory.getSupportedExchanges();

      // Map exchange IDs to exchange objects with name and logo
      return exchangeIds.map((id) => {
        // Format the exchange ID for display
        return {
          name: id.charAt(0).toUpperCase() + id.slice(1), // Capitalize first letter
          value: id,
          logoSrc: `https://via.placeholder.com/16?text=${id.charAt(0).toUpperCase()}`, // Placeholder with first letter
        };
      });
    },
    // Default to empty array if query fails
    placeholderData: [],
  });

  const exchanges = supportedExchanges || [];

  // Mutation for testing the API key connection
  const testApiKeyMutation = useMutation<TestApiKeyResponse, Error, string>({
    // Add types: Response, Error, Variables (apiKeyId)
    mutationFn: testExchangeApiKey, // Use the test function
    onSuccess: (data) => {
      // data is now typed as TestApiKeyResponse
      if (data.success) {
        // Open the success modal instead of showing a toast
        setIsSuccessModalOpen(true);
        // Close the current AddExchangeAccountModal
        onOpenChange(false);
        // Optionally refetch account list if test updates status
        // queryClient.invalidateQueries({ queryKey: ['exchangeApiKeys'] }); // Example refetch
      } else {
        // Show error toast only if the test failed
        toast({
          title: 'API Key Test Failed',
          description: data.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      // Explicitly type error
      // Display error toast
      toast({
        variant: 'destructive',
        title: 'API Key Test Failed',
        description:
          error.message || 'An unknown error occurred during testing.',
      });
    },
  });

  // Mutation for adding the API key
  const addApiKeyMutation = useMutation<
    AddApiKeyResponse,
    Error,
    Parameters<typeof addExchangeApiKey>[0]
  >({
    // Add types: Response, Error, Variables
    mutationFn: addExchangeApiKey,
    onSuccess: (data) => {
      // data is now typed as AddApiKeyResponse
      console.log('Exchange account added successfully, triggering test...');
      // Show success toast
      toast({
        title: 'API Key Added',
        description:
          'Exchange account added successfully. Testing connection...',
      });

      // Trigger the test mutation with the new API key ID
      if (data && data.api_key_id) {
        // Ensure we have the ID
        testApiKeyMutation.mutate(data.api_key_id);
      } else {
        console.error(
          'API Key ID not found in add response, cannot trigger test.',
        );
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            'Could not get API Key ID after adding. Test not performed.',
        });
      }

      // Keep original success logic
      // onOpenChange(false); // Close modal - Moved to testApiKeyMutation onSuccess
      if (onSuccess) {
        onSuccess(); // Call optional success callback (e.g., refetch accounts)
      }
      // Reset form fields after successful submission
      setSelectedExchange('');
      setApiKey('');
      setSecretKey('');
      setAccountLabel('');
    },
    onError: (error: Error) => {
      // Explicitly type error
      toast({
        variant: 'destructive',
        title: 'Error Adding Key',
        description: `Failed to add account: ${error.message}`,
      });
      console.error('Failed to add account:', error);
    },
  });

  const handleConnect = () => {
    console.log('[Debug] handleConnect entered.'); // Added log
    console.log('[Debug] State before mutate:', {
      selectedExchange,
      apiKey: apiKey ? '******' : '',
      secretKey: secretKey ? '******' : '',
      accountLabel,
    }); // Added log (mask secrets)

    // Show immediate feedback toast
    toast({
      title: 'Processing',
      description: 'Connecting to exchange...',
    });

    if (!selectedExchange || !apiKey || !secretKey) {
      // Basic validation - enhance as needed
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
      });
      console.error('[Debug] Validation failed: Missing required fields.'); // Enhanced log
      return;
    }

    try {
      addApiKeyMutation.mutate({
        // Use the renamed mutation
        exchange_id: selectedExchange,
        api_key: apiKey,
        api_secret: secretKey,
        key_nickname: accountLabel || selectedExchange, // Use selected exchange as label if none provided
      });
      console.log('[Debug] addApiKeyMutation.mutate() called successfully.'); // Added log
    } catch (error) {
      console.error('[Debug] Error calling addApiKeyMutation:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: 'Failed to connect to the exchange. Please try again.',
      });
    }
  };

  // Update label placeholder based on selection
  useEffect(() => {
    if (selectedExchange) {
      setAccountLabel(selectedExchange); // Pre-fill label based on exchange
    } else {
      setAccountLabel(''); // Clear if no exchange selected
    }
  }, [selectedExchange]);

  return (
    <>
      {' '}
      {/* Add React Fragment wrapper */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* Increased max-width slightly for better spacing */}
        <DialogContent className="sm:max-w-md bg-background text-foreground border-border">
          <DialogHeader>
            {/* Centered Title */}
            <DialogTitle className="text-center">
              Connect an Exchange Account
            </DialogTitle>
            {/* Removed default description, info text below serves purpose */}
            {/* <DialogDescription>Connect your exchange account using API keys.</DialogDescription> */}
          </DialogHeader>
          {/* Changed grid to flex column layout with increased vertical spacing */}
          <div className="flex flex-col space-y-6 py-4">
            {/* Label above Select */}
            <div className="space-y-2">
              <Label
                htmlFor="exchange"
                className="flex items-center text-sm font-medium text-muted-foreground"
              >
                <span className="mr-2">Select Exchange</span>
                <span className="flex-grow h-px bg-border"></span>{' '}
                {/* Horizontal line */}
              </Label>
              <Select
                onValueChange={setSelectedExchange}
                value={selectedExchange}
              >
                {/* Added green border */}
                <SelectTrigger
                  id="exchange"
                  className="w-full border-green-500 focus:ring-green-500"
                  disabled={isLoadingExchanges}
                >
                  <SelectValue
                    placeholder={
                      isLoadingExchanges
                        ? 'Loading exchanges...'
                        : 'Select an exchange'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {exchanges.map((exchange) => (
                    <SelectItem key={exchange.value} value={exchange.value}>
                      <div className="flex items-center">
                        <img
                          src={exchange.logoSrc}
                          alt={`${exchange.name} logo`}
                          className="h-4 w-4 mr-2"
                        />
                        <span>{exchange.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Adjusted info text styling and position */}
            <p className="text-xs text-muted-foreground text-center px-1 py-2 bg-muted/50 rounded-md border border-border">
              If required, please add the following IP address to your whitelist
              when creating API keys on Binance:{' '}
              <code className="font-semibold text-foreground bg-transparent p-0">
                3.96.106.53
              </code>
            </p>
            {/* Label above Input */}
            <div className="space-y-2">
              <Label
                htmlFor="api-key"
                className="flex items-center text-sm font-medium text-muted-foreground"
              >
                <span className="mr-2">API Key</span>
                <span className="flex-grow h-px bg-border"></span>{' '}
                {/* Horizontal line */}
              </Label>
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full" // Use full width
                placeholder="Enter your API Key"
              />
            </div>
            {/* Label above Input */}
            <div className="space-y-2">
              <Label
                htmlFor="secret-key"
                className="flex items-center text-sm font-medium text-muted-foreground"
              >
                <span className="mr-2">Secret Key</span>
                <span className="flex-grow h-px bg-border"></span>{' '}
                {/* Horizontal line */}
              </Label>
              <Input
                id="secret-key"
                type="password" // Use password type for secret
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full" // Use full width
                placeholder="Enter your Secret Key"
              />
            </div>
            {/* Label above Input */}
            <div className="space-y-2">
              <Label
                htmlFor="account-label"
                className="flex items-center text-sm font-medium text-muted-foreground"
              >
                <span className="mr-2">Account Label</span>
                <span className="flex-grow h-px bg-border"></span>{' '}
                {/* Horizontal line */}
              </Label>
              <Input
                id="account-label"
                value={accountLabel}
                onChange={(e) => setAccountLabel(e.target.value)}
                className="w-full" // Use full width
                placeholder="e.g., My Binance Spot"
              />
            </div>
          </div>
          {/* End of flex container */}
          {/* Adjusted footer layout and button styling */}
          <DialogFooter className="flex flex-row justify-between items-center pt-4 border-t border-border">
            {/* Adjusted Need Help? style */}
            <Button
              variant="link"
              className="text-sm text-muted-foreground hover:text-primary p-0 h-auto font-normal"
            >
              Need help?
            </Button>
            {/* Ensure primary button style is applied */}
            <Button
              type="button"
              onClick={handleConnect}
              disabled={
                addApiKeyMutation.isPending ||
                testApiKeyMutation.isPending ||
                !selectedExchange ||
                !apiKey ||
                !secretKey
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 min-w-[150px] relative"
            >
              {/* Show loading spinner when pending */}
              {(addApiKeyMutation.isPending ||
                testApiKeyMutation.isPending) && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              )}

              {/* Button text */}
              {addApiKeyMutation.isPending && 'Adding Key...'}
              {testApiKeyMutation.isPending &&
                !addApiKeyMutation.isPending &&
                'Testing Key...'}
              {!addApiKeyMutation.isPending &&
                !testApiKeyMutation.isPending &&
                'Connect Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Render the success modal */}
      <ConnectionSuccessModal
        open={isSuccessModalOpen}
        onOpenChange={setIsSuccessModalOpen}
      />
    </> // Close React Fragment wrapper
  );
}
