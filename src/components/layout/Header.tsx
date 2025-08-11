import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LeftPanel } from './LeftPanel';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, loading } = useAuth();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLeftPanelOpen(!leftPanelOpen);
  };
  
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
      const isOnSideNavPath = location.pathname === '/account' || location.pathname === '/marketplace';
      
      // Only navigate if we're not already on a valid path and not on auth/subscription/sidenav pages
      if (location.pathname !== roleHomePath && !isOnValidPath && !isOnSubscriptionPath && !isOnAuthPath && !isOnSideNavPath) {
        // Add a small delay to prevent rapid navigation
        const timeoutId = setTimeout(() => {
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
          navigate('/');
        }, 200);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [userProfile?.role, userProfile, loading, navigate, location.pathname, navItems]);
  
  return (
    <>
      {/* Left Panel - only show for client users */}
      {userProfile?.role === 'client' && (
        <LeftPanel 
          isOpen={leftPanelOpen}
          onClose={() => setLeftPanelOpen(false)}
        />
      )}
      
      <header className="bg-shadowforce border-b border-guardian/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center h-20 relative">
          {/* Menu Toggle and Logo - positioned absolutely to the left */}
          <div className="absolute left-0 flex items-center gap-4">
            {/* Menu Toggle Button - Only for Clients */}
            {userProfile?.role === 'client' && (
              <button
                onClick={handleMenuToggle}
                className="flex items-center justify-center w-8 h-8 bg-shadowforce-light hover:bg-supernova hover:text-shadowforce text-guardian rounded-lg transition-colors"
                title="Toggle Navigation Menu"
              >
                <Menu size={16} />
              </button>
            )}
            
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

          {/* Sign up and Sign in buttons - positioned absolutely to the right, only for unauthenticated users on landing page */}
          {!userProfile && location.pathname === '/' && (
            <div className="absolute right-0 flex items-center gap-3">
              <Button
                onClick={() => navigate('/signup')}
                size="sm"
                className="glow-supernova"
              >
                SIGN UP
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                size="sm"
                className="text-guardian hover:text-supernova"
              >
                SIGN IN
              </Button>
            </div>
          )}

        </div>
      </div>
    </header>
    </>
  );
};