import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  to: string;
  label?: string;
}

/**
 * Consistent back button component for navigation
 * Uses the global button styling from the design system
 */
export function BackButton({ to, label = 'Back' }: BackButtonProps) {
  return (
    <Button variant="outline" asChild>
      <Link to={to}>
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
