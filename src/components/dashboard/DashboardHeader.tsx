import { ExchangeAccountSelector } from '@/components/dashboard/ExchangeAccountSelector';
import { PortfolioIndicators } from '@/components/dashboard/PortfolioIndicators';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import ErrorBoundary from '@/components/ErrorBoundary';

export function DashboardHeader() {
  const [hasError, setHasError] = useState(false);
  const { clearSelectedAccount } = useSelectedAccount();

  // Error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error detected in dashboard components:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Reset function for when errors occur
  const handleReset = () => {
    console.log('Resetting dashboard state');
    clearSelectedAccount();
    setHasError(false);
    window.location.reload();
  };

  // If there's an error, show a reset button
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-900 rounded-lg mb-8">
        <h3 className="text-xl font-medium text-red-500 mb-4">
          Something went wrong
        </h3>
        <p className="text-gray-400 mb-4">
          There was an error loading the dashboard components.
        </p>
        <Button
          onClick={handleReset}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Reset Dashboard
        </Button>
      </div>
    );
  }

  return (
    // Using flex layout for responsiveness, items centered vertically
    // Added gap for spacing between elements
    <ErrorBoundary>
      <div
        className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2
      "
      >
        {/* Left: Account Selector - Allow shrinking but not growing beyond content size */}
        <div className="flex-shrink-0 w-full md:w-auto">
          <ExchangeAccountSelector />
        </div>

        {/* Middle: Indicators - Allow growing to take available space */}
        <div className="flex-grow w-full md:w-auto">
          <PortfolioIndicators />
        </div>

        {/* Right: Deposit/Earn Button - Allow shrinking but not growing */}
        {/* Styling based on the image: Purple background, white text, bullet points, arrow icon */}
        <div className="flex-shrink-0 w-full md:w-auto">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full md:w-auto px-4 py-3 rounded-lg flex items-center justify-between text-left h-auto">
            <div className="flex flex-col items-start mr-4">
              {/* Using spans for the two lines of text */}
              <span className="text-xs font-medium leading-tight">
                Deposit OMNI &
              </span>
              <span className="text-xs font-medium leading-tight">
                Earn 20% APY
              </span>
            </div>
            <ArrowRight size={18} className="flex-shrink-0" />
          </Button>
        </div>
      </div>
    </ErrorBoundary>
  );
}
