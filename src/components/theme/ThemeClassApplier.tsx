import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUnifiedTheme } from './UnifiedThemeProvider';
import { isLandingPage } from '@/utils/pageTypeUtils';

/**
 * ThemeClassApplier component
 * 
 * This component ensures that the appropriate theme classes are applied to the body
 * based on the current route and theme.
 * 
 * It should be placed high in the component tree, ideally right after the ThemeProvider.
 */
export function ThemeClassApplier() {
  const location = useLocation();
  const { theme } = useUnifiedTheme();
  const currentPath = location.pathname;
  
  // Determine if this is a landing page
  const isLanding = isLandingPage(currentPath);
  
  // Apply appropriate classes based on the page type and theme
  useEffect(() => {
    const body = document.body;
    
    // Apply landing page class if needed
    if (isLanding) {
      body.classList.add('landing-page');
    } else {
      body.classList.remove('landing-page');
    }
    
    // Apply theme classes
    if (theme === 'dark') {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
    } else {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
    }
    
    // Apply data-theme attribute for CSS targeting
    body.setAttribute('data-theme', theme);
    
    // Cleanup function
    return () => {
      // We don't remove these classes on cleanup because they should persist
      // between route changes. They'll be updated by the next route's instance
      // of this component.
    };
  }, [isLanding, theme, currentPath]);
  
  // This component doesn't render anything
  return null;
}
