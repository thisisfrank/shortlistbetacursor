import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/layout/Layout';

// Route Guards
import { 
  AdminRoute, 
  ClientRoute, 
  SourcerRoute, 
  AuthenticatedRoute,
  PublicRoute 
} from './components/auth/RoleBasedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AdminPage } from './pages/AdminPage';
import { ClientPage } from './pages/ClientPage';
import { SourcerPage } from './pages/SourcerPage';
import { CandidatesPage } from './pages/CandidatesPage';
import { AccountPage } from './pages/AccountPage';
import { SourcerAccountPage } from './pages/SourcerAccountPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { AIMessageGeneratorPage } from './pages/AIMessageGeneratorPage';
import { FormatJobsPage } from './pages/FormatJobsPage';

// Auth Pages
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { EmailConfirmationPage } from './components/auth/EmailConfirmationPage';

// Legal Pages
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';

// Subscription Pages
import { SubscriptionPlans } from './components/subscription/SubscriptionPlans';
import { SubscriptionSuccess } from './components/subscription/SubscriptionSuccess';

import { SignOutWrapper } from './components/auth/SignOutWrapper';

function App() {
  
  return (
    <AuthProvider>
      <DataProvider>
        <SignOutWrapper>
          <BrowserRouter>
            <Routes>
              {/* Public Routes - no layout wrapper to avoid auth loading issues */}
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
              <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
              <Route path="/confirm-email" element={<PublicRoute><EmailConfirmationPage /></PublicRoute>} />
              
              {/* Legal Pages - completely independent, no auth required */}
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              
              {/* All other routes use Layout */}
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    {/* Landing Page - accessible to all, but shows different content based on auth */}
                    <Route path="/" element={<LandingPage />} />
                    
                    {/* Role-Specific Routes */}
                    <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                    <Route path="/admin/format-jobs" element={<AdminRoute><FormatJobsPage /></AdminRoute>} />
                    <Route path="/sourcer" element={<SourcerRoute><SourcerPage /></SourcerRoute>} />
                    
                    {/* Client Routes */}
                    <Route path="/client" element={<ClientRoute><ClientPage /></ClientRoute>} />
                    <Route path="/candidates" element={<ClientRoute><CandidatesPage /></ClientRoute>} />
                    
                    {/* Account & Settings Routes - All Authenticated Users */}
                    <Route path="/account" element={<AuthenticatedRoute><AccountPage /></AuthenticatedRoute>} />
                    <Route path="/sourcer/account" element={<SourcerRoute><SourcerAccountPage /></SourcerRoute>} />
                    <Route path="/marketplace" element={<AuthenticatedRoute><MarketplacePage /></AuthenticatedRoute>} />
                    <Route path="/ai-message-generator" element={<AuthenticatedRoute><AIMessageGeneratorPage /></AuthenticatedRoute>} />
                    
                    {/* Subscription Routes - All Authenticated Users */}
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

          </BrowserRouter>
        </SignOutWrapper>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;