import React from 'react';
import { StyleGuide } from '@/components/theme/StyleGuide';
import Navbar from '@/components/Navbar';

/**
 * StyleGuidePage component that wraps the StyleGuide component
 * This page is accessible via the /style-guide route
 */
export default function StyleGuidePage() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8">
        <StyleGuide />
      </div>
    </>
  );
}
