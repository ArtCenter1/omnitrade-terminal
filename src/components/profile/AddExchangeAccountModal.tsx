import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addExchangeApiKey, testExchangeApiKey } from '@/services/exchangeApiKeyService'; // Assuming this path is correct
import { useToast } from "@/components/ui/use-toast";
import ConnectionSuccessModal from './ConnectionSuccessModal'; // Import the new success modal
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export function AddExchangeAccountModal({ open, onOpenChange, onSuccess }: AddExchangeAccountModalProps) {
  // Placeholder state and handlers - actual logic not required for this task
  const [selectedExchange, setSelectedExchange] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [accountLabel, setAccountLabel] = useState('');
  const { toast } = useToast();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // State for success modal

  // Define exchange data with placeholder logos
  const exchanges = [
    { name: 'Binance', value: 'Binance', logoSrc: 'https://via.placeholder.com/16' },
    { name: 'KuCoin', value: 'KuCoin', logoSrc: 'https://via.placeholder.com/16' },
    { name: 'CryptoRight', value: 'CryptoRight', logoSrc: 'https://via.placeholder.com/16' },
    // Add other exchanges with their logos here
  ];

  const queryClient = useQueryClient(); // Get query client for potential refetching

  // Mutation for testing the API key connection
  const testApiKeyMutation = useMutation<TestApiKeyResponse, Error, string>({ // Add types: Response, Error, Variables (apiKeyId)
    mutationFn: testExchangeApiKey, // Use the test function
    onSuccess: (data) => { // data is now typed as TestApiKeyResponse
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
          title: "API Key Test Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => { // Explicitly type error
      // Display error toast
      toast({ variant: "destructive", title: "API Key Test Failed", description: error.message || "An unknown error occurred during testing." });
    },
  });

  // Mutation for adding the API key
  const addApiKeyMutation = useMutation<AddApiKeyResponse, Error, Parameters<typeof addExchangeApiKey>[0]>({ // Add types: Response, Error, Variables
    mutationFn: addExchangeApiKey,
    onSuccess: (data) => { // data is now typed as AddApiKeyResponse
      console.log("Exchange account added successfully, triggering test...");
      // Trigger the test mutation with the new API key ID
      if (data && data.api_key_id) { // Ensure we have the ID
        testApiKeyMutation.mutate(data.api_key_id);
      } else {
         console.error("API Key ID not found in add response, cannot trigger test.");
         toast({ variant: "destructive", title: "Error", description: "Could not get API Key ID after adding. Test not performed." });
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
    onError: (error: Error) => { // Explicitly type error
      toast({ variant: "destructive", title: "Error Adding Key", description: `Failed to add account: ${error.message}` });
      console.error("Failed to add account:", error);
    },
  });

  const handleConnect = () => {
    console.log("[Debug] handleConnect entered."); // Added log
    console.log("[Debug] State before mutate:", { selectedExchange, apiKey: apiKey ? '******' : '', secretKey: secretKey ? '******' : '', accountLabel }); // Added log (mask secrets)

    if (!selectedExchange || !apiKey || !secretKey) {
        // Basic validation - enhance as needed
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all required fields." });
        console.error("[Debug] Validation failed: Missing required fields."); // Enhanced log
        return;
    }
    addApiKeyMutation.mutate({ // Use the renamed mutation
      exchange_id: selectedExchange,
      api_key: apiKey,
      api_secret: secretKey,
      key_nickname: accountLabel || selectedExchange, // Use selected exchange as label if none provided
    });
    console.log("[Debug] addApiKeyMutation.mutate() called successfully."); // Added log
  };

  // Update label placeholder based on selection
  useEffect(() => {
    if (selectedExchange) {
      setAccountLabel(selectedExchange); // Pre-fill label based on exchange
    } else {
        setAccountLabel(''); // Clear if no exchange selected
    }
  }, [selectedExchange])


  return (
    <> {/* Add React Fragment wrapper */}
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Increased max-width slightly for better spacing */}
      <DialogContent className="sm:max-w-md bg-background text-foreground border-border">
        <DialogHeader>
          {/* Centered Title */}
          <DialogTitle className="text-center">Connect an Exchange Account</DialogTitle>
          {/* Removed default description, info text below serves purpose */}
          {/* <DialogDescription>Connect your exchange account using API keys.</DialogDescription> */}
        </DialogHeader>
        {/* Changed grid to flex column layout with increased vertical spacing */}
        <div className="flex flex-col space-y-6 py-4">
          {/* Label above Select */}
          <div className="space-y-2">
            <Label htmlFor="exchange" className="flex items-center text-sm font-medium text-muted-foreground">
              <span className="mr-2">Select Exchange</span>
              <span className="flex-grow h-px bg-border"></span> {/* Horizontal line */}
            </Label>
            <Select onValueChange={setSelectedExchange} value={selectedExchange}>
              {/* Added green border */}
              <SelectTrigger id="exchange" className="w-full border-green-500 focus:ring-green-500">
                <SelectValue placeholder="Select an exchange" />
              </SelectTrigger>
              <SelectContent>
                {exchanges.map((exchange) => (
                  <SelectItem key={exchange.value} value={exchange.value}>
                    <div className="flex items-center">
                      <img src={exchange.logoSrc} alt={`${exchange.name} logo`} className="h-4 w-4 mr-2" />
                      <span>{exchange.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           {/* Adjusted info text styling and position */}
           <p className="text-xs text-muted-foreground text-center px-1 py-2 bg-muted/50 rounded-md border border-border">
             If required, please add the following IP address to your whitelist when creating API keys on Binance: <code className="font-semibold text-foreground bg-transparent p-0">3.96.106.53</code>
           </p>
          {/* Label above Input */}
          <div className="space-y-2">
             <Label htmlFor="api-key" className="flex items-center text-sm font-medium text-muted-foreground">
               <span className="mr-2">API Key</span>
               <span className="flex-grow h-px bg-border"></span> {/* Horizontal line */}
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
             <Label htmlFor="secret-key" className="flex items-center text-sm font-medium text-muted-foreground">
               <span className="mr-2">Secret Key</span>
               <span className="flex-grow h-px bg-border"></span> {/* Horizontal line */}
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
             <Label htmlFor="account-label" className="flex items-center text-sm font-medium text-muted-foreground">
               <span className="mr-2">Account Label</span>
               <span className="flex-grow h-px bg-border"></span> {/* Horizontal line */}
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
           <Button variant="link" className="text-sm text-muted-foreground hover:text-primary p-0 h-auto font-normal">Need help?</Button>
           {/* Ensure primary button style is applied */}
           <Button
             type="button"
             onClick={handleConnect}
             disabled={addApiKeyMutation.isPending || testApiKeyMutation.isPending || !selectedExchange || !apiKey || !secretKey}
             className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
           >
             {/* Simplified conditional rendering for button text */}
             {addApiKeyMutation.isPending && 'Adding Key...'}
             {testApiKeyMutation.isPending && !addApiKeyMutation.isPending && 'Testing Key...'}
             {!addApiKeyMutation.isPending && !testApiKeyMutation.isPending && 'Connect Account'}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {/* Render the success modal */}
    <ConnectionSuccessModal open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen} />
    </> // Close React Fragment wrapper
  );
}