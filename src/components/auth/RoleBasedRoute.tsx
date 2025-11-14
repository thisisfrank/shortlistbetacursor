import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('client' | 'sourcer' | 'admin')[];
  redirectTo?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo 
}) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supernova mx-auto mb-4"></div>
          <p className="text-guardian font-jakarta">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    // Instead of redirecting to /login, render children or a fallback (e.g., landing page)
    return <Navigate to="/" replace />;
  }

  // No user profile but user exists - profile might still be loading
  if (!userProfile && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supernova mx-auto mb-4"></div>
          <p className="text-guardian font-jakarta">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Check if user's role is allowed
  if (userProfile && !allowedRoles.includes(userProfile.role)) {
    // Smart redirect based on user's actual role
    return <Navigate to={getRoleHomePage(userProfile.role)} replace />;
  }

  return <>{children}</>;
};

// Helper function to get role-specific home pages
const getRoleHomePage = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'sourcer':
      return '/sourcer';
    case 'client':
    default:
      return '/';
  }
};

// Convenience components for specific roles
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['admin']}>{children}</RoleBasedRoute>
);

export const ClientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['client']}>{children}</RoleBasedRoute>
);

export const SourcerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['sourcer']}>{children}</RoleBasedRoute>
);

export const ClientOrAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['client', 'admin']}>{children}</RoleBasedRoute>
);

export const SourcerOrAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['sourcer', 'admin']}>{children}</RoleBasedRoute>
);

export const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['client', 'sourcer', 'admin']}>{children}</RoleBasedRoute>
);

// Public route for unauthenticated users
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-shadowforce flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supernova mx-auto mb-4"></div>
          <p className="text-guardian font-jakarta">Loading...</p>
        </div>
      </div>
    );
  }

  // Special handling for password reset and email confirmation pages
  // These pages need to work even when user is temporarily authenticated
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  const currentHash = window.location.hash;
  const isPasswordResetFlow = currentPath === '/reset-password' || currentPath === '/confirm-email';
  const hasResetTokens = currentSearch.includes('access_token') || currentHash.includes('access_token');
  
  console.log('🔍 PublicRoute debug:', {
    currentPath,
    currentSearch,
    currentHash,
    isPasswordResetFlow,
    hasResetTokens,
    hasUser: !!user,
    hasUserProfile: !!userProfile,
    userRole: userProfile?.role
  });
  
  if (isPasswordResetFlow && hasResetTokens) {
    console.log('🔑 ✅ Allowing password reset/confirmation page despite authentication');
    return <>{children}</>;
  }

  // Only redirect if we have both user AND complete profile (prevents redirects during login attempts)
  if (user && userProfile && userProfile.role) {
    console.log('🔄 PublicRoute redirecting authenticated user to:', getRoleHomePage(userProfile.role));
    return <Navigate to={getRoleHomePage(userProfile.role)} replace />;
  }

  // Always render children for unauthenticated or incomplete authentication states
  return <>{children}</>;
};