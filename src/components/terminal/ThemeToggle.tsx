import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Terminal Theme Toggle Component
 * 
 * A simple toggle button for switching between light and dark themes in the terminal.
 */
export const TerminalThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="h-8 w-8 rounded-full bg-theme-tertiary hover:bg-theme-hover theme-transition"
          >
            {theme === 'dark' ? (
              <Sun size={16} className="text-warning-color" />
            ) : (
              <Moon size={16} className="text-theme-link" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
