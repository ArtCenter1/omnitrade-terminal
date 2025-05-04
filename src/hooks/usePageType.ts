import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isLandingPage, applyLandingPageClass } from '@/utils/pageTypeUtils';

/**
 * Hook to determine if the current page is a landing page or a protected page
 * Also automatically applies the landing-page class to the body element
 * 
 * @returns An object with isLandingPage and isProtectedPage booleans
 */
export function usePageType() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isLanding = isLandingPage(currentPath);
  const isProtected = !isLanding;
  
  // Apply the landing-page class to the body element when the component mounts
  // and remove it when the component unmounts
  useEffect(() => {
    applyLandingPageClass(isLanding);
    
    // Cleanup function to remove the class when the component unmounts
    return () => {
      // Only remove the class if we added it
      if (isLanding) {
        document.body.classList.remove('landing-page');
      }
    };
  }, [isLanding]);
  
  return {
    isLandingPage: isLanding,
    isProtectedPage: isProtected
  };
}
