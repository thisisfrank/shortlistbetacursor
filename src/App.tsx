import React from 'react';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/layout/Layout';

// Route Guards
import { 
  AdminRoute, 
  ClientRoute, 
  SourcerRoute, 
  ClientOrAdminRoute,
  PublicRoute 
} from './components/auth/RoleBasedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AdminPage } from './pages/AdminPage';
import { ClientPage } from './pages/ClientPage';
import { SourcerPage } from './pages/SourcerPage';
import { CandidatesPage } from './pages/CandidatesPage';

// Auth Pages
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';

// Subscription Pages
import { SubscriptionPlans } from './components/subscription/SubscriptionPlans';
import { SubscriptionSuccess } from './components/subscription/SubscriptionSuccess';
import { AuthDebug } from './components/debug/AuthDebug';
import { DataDebug } from './components/debug/DataDebug';
import { SignOutWrapper } from './components/auth/SignOutWrapper';

function App() {
  useEffect(() => {
    // Check environment variables on app start
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('🚀 App component mounting...');
    
    console.log('🚀 App starting with environment:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseAnonKey,
      nodeEnv: import.meta.env.MODE,
      isDev: import.meta.env.DEV
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Supabase environment variables not configured. App will run in demo mode with local storage only.');
    }
  }, []);
  
  return (
    <AuthProvider>
      <DataProvider>
        <SignOutWrapper>
          <BrowserRouter>
            <Routes>
              {/* Public Routes - no layout wrapper to avoid auth loading issues */}
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
              
              {/* All other routes use Layout */}
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    {/* Landing Page - accessible to all, but shows different content based on auth */}
                    <Route path="/" element={<LandingPage />} />
                    
                    {/* Role-Specific Routes */}
                    <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                    <Route path="/sourcer" element={<SourcerRoute><SourcerPage /></SourcerRoute>} />
                    
                    {/* Client Routes */}
                    <Route path="/client" element={<ClientRoute><ClientPage /></ClientRoute>} />
                    <Route path="/candidates" element={<ClientRoute><CandidatesPage /></ClientRoute>} />
                    
                    {/* Subscription Routes - Client Only */}
                    <Route path="/subscription" element={
                      <ClientRoute><SubscriptionPlans /></ClientRoute>
                    } />
                    <Route path="/subscription/success" element={<ClientRoute><SubscriptionSuccess /></ClientRoute>} />
                    
                    {/* Catch-all - redirect to appropriate home based on role */}
                    <Route path="*" element={<LandingPage />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
            <AuthDebug />
            <DataDebug />
          </BrowserRouter>
        </SignOutWrapper>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;