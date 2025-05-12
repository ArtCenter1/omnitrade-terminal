/**
 * VS Code Tabs Demo Page
 *
 * This page demonstrates the VS Code-like tab functionality
 * with multiple tab groups and drag-and-drop capabilities.
 */

import { VSCodeTabsDemo } from '@/components/terminal/VSCodeTabsDemo';

export default function TabsDemo() {
  return (
    <div className="h-screen w-full bg-gray-900">
      <VSCodeTabsDemo />
    </div>
  );
}
