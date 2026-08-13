// src/main.jsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY === 'pk_test_REPLACE_ME') {
  console.warn(
    '⚠️  Clerk publishable key not set.\n' +
    '   1. Go to https://dashboard.clerk.com\n' +
    '   2. Create an app → copy the Publishable Key\n' +
    '   3. Paste it into client/.env as VITE_CLERK_PUBLISHABLE_KEY'
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY || 'pk_test_placeholder'}>
      <App />
    </ClerkProvider>
  </StrictMode>
);
