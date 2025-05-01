// src/components/settings/MockDataWarning.tsx
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useFeatureFlagsContext } from '@/config/featureFlags';

interface MockDataWarningProps {
  message?: string;
  className?: string;
}

/**
 * Component to display a warning when using mock data
 */
export function MockDataWarning({
  message = 'Using mock data. Some features may be limited.',
  className,
}: MockDataWarningProps) {
  const flags = useFeatureFlagsContext();
  
  // Only show the warning if using mock data
  if (!flags.useMockData) {
    return null;
  }
  
  return (
    <Alert variant="warning" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Mock Data Mode</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

/**
 * Component to display a warning when API authentication fails
 */
export function ApiAuthWarning({
  message = 'API authentication failed. Using mock data for API keys.',
  className,
}: MockDataWarningProps) {
  return (
    <Alert variant="warning" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Authentication Warning</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
