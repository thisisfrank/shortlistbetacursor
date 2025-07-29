import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from './UserMenu';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, loading } = useAuth();
  
  // Get the role-appropriate home path
  const getRoleHomePath = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'sourcer':
        return '/sourcer';
      case 'client':
        return '/client'; // Changed from '/' to '/client' for clients
      default:
        return '/';
    }
  };
  
  const isActive = (path: string) => {
    if (!userProfile) return location.pathname === path;
    
    // For clients, handle both client page and candidates page
    if (userProfile.role === 'client') {
      // If we're on the client page and checking the client path
      if (path === '/client' && location.pathname === '/client') {
        return true;
      }
      // If we're on the candidates page and checking the candidates path
      if (path === '/candidates' && location.pathname === '/candidates') {
        return true;
      }
      // For other paths, use exact match
      return location.pathname === path;
    }
    
    // For other roles, use the original logic
    const roleHomePath = getRoleHomePath(userProfile.role);
    
    // If we're checking the role's home path and we're currently on it
    if (path === roleHomePath && location.pathname === roleHomePath) {
      return true;
    }
    
    // For other paths, use exact match
    return location.pathname === path;
  };
  
  const getNavItems = () => {
    if (!userProfile) {
      // Anonymous users only see the main landing page
      return [
        { path: '/', label: 'GET CANDIDATES', key: 'home' }
      ];
    }

    switch (userProfile.role) {
      case 'client':
        return [
          { path: '/client', label: 'GET CANDIDATES', key: 'submit' },
          { path: '/candidates', label: 'MY OPEN JOBS', key: 'candidates' }
        ];
      case 'sourcer':
        return [
          { path: '/sourcer', label: 'SOURCER HUB', key: 'sourcer' }
        ];
      case 'admin':
        return [
          { path: '/admin', label: 'ADMIN CONTROL', key: 'admin' }
        ];
      default:
        return [
          { path: '/', label: 'GET CANDIDATES', key: 'home' }
        ];
    }
  };

  const navItems = getNavItems();
  
  // Auto-navigate to role home when role changes - with debouncing to prevent flashing
  React.useEffect(() => {
    // Don't run navigation logic while loading
    if (loading) return;
    
    // Only run navigation logic if userProfile is loaded (not null and not undefined)
    if (userProfile && userProfile.role) {
      const roleHomePath = getRoleHomePath(userProfile.role);
      const isOnValidPath = navItems.some(item => item.path === location.pathname);
      const isOnSubscriptionPath = location.pathname.startsWith('/subscription');
      const isOnAuthPath = location.pathname === '/login' || location.pathname === '/signup' || 
                          location.pathname === '/forgot-password' || location.pathname === '/reset-password';
      
      // Only navigate if we're not already on a valid path and not on auth/subscription pages
      if (location.pathname !== roleHomePath && !isOnValidPath && !isOnSubscriptionPath && !isOnAuthPath) {
        // Add a small delay to prevent rapid navigation
        const timeoutId = setTimeout(() => {
          console.log('🏠 Header: Navigating to role home:', roleHomePath);
          navigate(roleHomePath);
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    } else if (userProfile === null && !loading) {
      // FIXED: Only navigate to landing page after loading is complete AND userProfile is null
      // This prevents premature redirects during the initial loading phase
      if (location.pathname !== '/' && 
          !location.pathname.startsWith('/login') && 
          !location.pathname.startsWith('/signup') &&
          !location.pathname.startsWith('/forgot-password') &&
          !location.pathname.startsWith('/reset-password')) {
        const timeoutId = setTimeout(() => {
          console.log('🏠 Header: No user profile after loading complete, navigating to landing page');
          navigate('/');
        }, 200);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [userProfile?.role, userProfile, loading, navigate, location.pathname, navItems]);
  
  return (
    <header className="bg-shadowforce border-b border-guardian/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center h-20 relative">
          {/* Logo - positioned absolutely to the left */}
          <div className="absolute left-0 flex items-center">
            <Link to="/" className="flex items-center text-supernova hover:text-supernova-light transition-colors">
              <div className="sr-logo">
                <span className="text-supernova">SUPER</span>
                <span className="text-white-knight ml-1">RECRUITER</span>
              </div>
            </Link>
          </div>
          
          {/* Navigation - centered */}
          {!(location.pathname === '/' && navItems.filter(item => item.label === 'GET CANDIDATES').length === 1) && (
            <nav className={`flex space-x-1 bg-shadowforce-light/50 rounded-xl px-2 py-2 border border-guardian/20 transition-opacity duration-200 ${
              loading && userProfile ? 'opacity-50' : 'opacity-100'
            }`}>
              {navItems.map((item) => {
                if (item.label === 'GET CANDIDATES' && location.pathname === '/') {
                  return null;
                }
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={`px-6 py-3 rounded-lg text-sm font-jakarta font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-supernova text-shadowforce shadow-lg glow-supernova' 
                        : 'text-guardian hover:bg-shadowforce-light hover:text-supernova'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
          
          {/* User Menu - positioned absolutely to the right */}
          <div className="absolute right-0">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};