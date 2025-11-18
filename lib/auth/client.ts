import { authClient } from 'lantaidua-universal-auth';

// Auth client configuration from .env.local
const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const CLERK_DOMAIN = process.env.NEXT_PUBLIC_CLERK_DOMAIN;
const CLERK_IS_SATELLITE = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === 'true';

// Initialize the auth client (v1.1.0)
let isInitialized = false;

export async function initializeAuthClient() {
  // Check if already initialized using the latest API
  if (isInitialized || authClient.authClientInitialized) {
    return;
  }

  if (!CLERK_PUBLISHABLE_KEY) {
    console.warn('Clerk publishable key is not set. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env.local file.');
    return;
  }

  try {
    // v1.1.0 API - createAuthClient with options
    const options: {
      domain?: string;
      isSatellite?: boolean;
      signInUrl?: string;
      signUpUrl?: string;
      afterSignInUrl?: string;
      afterSignUpUrl?: string;
    } = {
      signInUrl: '/auth/sign-in',
      signUpUrl: '/auth/sign-up',
      afterSignInUrl: '/dashboard',
      afterSignUpUrl: '/dashboard',
    };

    // Add optional domain if set
    if (CLERK_DOMAIN) {
      options.domain = CLERK_DOMAIN;
    }

    // Add optional satellite flag if set
    if (CLERK_IS_SATELLITE) {
      options.isSatellite = true;
    }

    // Initialize using v1.1.0 API
    await authClient.createAuthClient(CLERK_PUBLISHABLE_KEY, options);
    
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize auth client:', error);
    throw error;
  }
}

// Get the current environment
// Uses NEXT_PUBLIC_APP_ENV or NODE_ENV from .env.local
export function getAuthEnvironment(): 'dev' | 'staging' | 'prod' {
  try {
    return authClient.getEnvironment();
  } catch (error) {
    console.error('Failed to get auth environment:', error);
    // Fallback to environment detection
    const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
    const nodeEnv = process.env.NODE_ENV;
    
    if (appEnv === 'prod' || nodeEnv === 'production') return 'prod';
    if (appEnv === 'staging') return 'staging';
    return 'dev';
  }
}

// Check if client is initialized
export function isAuthClientInitialized(): boolean {
  return authClient.authClientInitialized || isInitialized;
}

// Get the auth client instance
export function getAuthClient() {
  if (!isAuthClientInitialized()) {
    throw new Error('Auth client is not initialized. Call initializeAuthClient() first.');
  }
  return authClient;
}

// Export the authClient for direct access if needed
export { authClient };

