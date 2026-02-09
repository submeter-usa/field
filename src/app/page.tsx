'use client';

import FieldReadingsApp from './components/field/FieldReadingsApp';

/**
 * Page Entry Point
 * 
 * This is the route handler that Next.js calls.
 * We simply import and render the main app component.
 * 
 * Path: src/app/field/page.tsx (or wherever you want this route)
 */
export default function Page() {
  return <FieldReadingsApp />;
}