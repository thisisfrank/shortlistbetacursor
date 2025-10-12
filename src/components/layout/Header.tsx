import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Menu, X } from 'lucide-react';

import { Button } from '../ui/Button';
import { getUserUsageStats } from '../../utils/userUsageStats';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, loading } = useAuth();
  const { jobs, candidates, tiers, creditTransactions } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  
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
          { path: '/candidates', label: 'MY OPEN JOBS', key: 'candidates' },
          { path: '/marketplace', label: 'SUPERPOWERS', key: 'marketplace' }
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
  
  // Calculate user credits using the sophisticated stats function
  const userStats = getUserUsageStats(userProfile as any, jobs, candidates, tiers, creditTransactions);
  const availableCredits = userStats?.candidatesRemaining ?? userProfile?.availableCredits ?? 0;
  
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
      const isOnSideNavPath = location.pathname === '/account' || location.pathname === '/sourcer/account' || location.pathname === '/marketplace' || location.pathname === '/ai-message-generator';
      
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
    <header className="bg-shadowforce border-b border-guardian/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-center h-20 relative">
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

          {/* Credits box - positioned between center nav and right side */}
          {userProfile && (
            <div className="absolute right-64 flex items-center">
              <Link 
                to="/subscription"
                className="flex items-center gap-1 bg-shadowforce-light/50 px-3 py-1 rounded-lg border border-guardian/20 hover:bg-shadowforce-light/70 hover:border-supernova/30 transition-all cursor-pointer"
              >
                <span className="text-xs font-jakarta text-guardian">Credits:</span>
                <span className="text-sm font-semibold text-supernova">
                  {availableCredits}
                </span>
              </Link>
            </div>
          )}

          {/* User info and Sign up/Sign in buttons - positioned absolutely to the right */}
          <div className="absolute right-6 flex items-center gap-3">
          {/* Show user info when authenticated */}
          {userProfile && (
            <Link 
              to="/account"
              className="text-white-knight hover:text-supernova transition-colors cursor-pointer flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-shadowforce-light rounded-full flex items-center justify-center border border-guardian/20">
                <span className="text-lg">{userProfile.avatar || '👤'}</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">
                  {(() => {
                    console.log('🔍 Debug - userProfile.name:', userProfile.name);
                    console.log('🔍 Debug - userProfile.email:', userProfile.email);
                    console.log('🔍 Debug - name length:', userProfile.name?.length);
                    console.log('🔍 Debug - name trimmed:', userProfile.name?.trim());
                    
                    if (userProfile.name && userProfile.name.trim() !== '') {
                      const firstName = userProfile.name.split(' ')[0];
                      console.log('🔍 Debug - firstName extracted:', firstName);
                      return firstName;
                    } else {
                      // Fallback: use first part of email before @ as name
                      const emailName = userProfile.email?.split('@')[0] || 'User';
                      const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
                      console.log('🔍 Debug - Using email fallback:', capitalizedName);
                      return capitalizedName;
                    }
                  })()}
                </span>
                <span className="text-xs text-guardian font-jakarta">
                  {userProfile.email}
                </span>
              </div>
            </Link>
          )}
            
            {/* Show auth buttons only for unauthenticated users on landing page */}
            {!userProfile && location.pathname === '/' && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center text-supernova hover:text-supernova-light transition-colors">
            <div className="text-lg font-anton">
              <span className="text-supernova">SUPER</span>
              <span className="text-white-knight ml-1">RECRUITER</span>
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-supernova hover:text-supernova-light transition-colors p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-shadowforce-light border-t border-guardian/20 py-4 space-y-2">
            {/* Navigation Items */}
            {!(location.pathname === '/' && navItems.filter(item => item.label === 'GET CANDIDATES').length === 1) && (
              <nav className="space-y-2">
                {navItems.map((item) => {
                  if (item.label === 'GET CANDIDATES' && location.pathname === '/') {
                    return null;
                  }
                  
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.key}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-4 py-3 rounded-lg text-sm font-jakarta font-semibold transition-all duration-200 ${
                        active
                          ? 'bg-supernova text-shadowforce shadow-lg' 
                          : 'text-guardian hover:bg-shadowforce hover:text-supernova'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Credits - Mobile */}
            {userProfile && (
              <Link 
                to="/subscription"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 bg-shadowforce rounded-lg border border-guardian/20"
              >
                <span className="text-sm font-jakarta text-guardian">Credits:</span>
                <span className="text-lg font-semibold text-supernova">
                  {availableCredits}
                </span>
              </Link>
            )}

            {/* User Info - Mobile */}
            {userProfile && (
              <Link 
                to="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-shadowforce rounded-lg border border-guardian/20 hover:border-supernova/30 transition-all"
              >
                <div className="w-10 h-10 bg-shadowforce-light rounded-full flex items-center justify-center border border-guardian/20">
                  <span className="text-xl">{userProfile.avatar || '👤'}</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-white-knight">
                    {(() => {
                      if (userProfile.name && userProfile.name.trim() !== '') {
                        const firstName = userProfile.name.split(' ')[0];
                        return firstName;
                      } else {
                        const emailName = userProfile.email?.split('@')[0] || 'User';
                        const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
                        return capitalizedName;
                      }
                    })()}
                  </span>
                  <span className="text-xs text-guardian font-jakarta">
                    {userProfile.email}
                  </span>
                </div>
              </Link>
            )}

            {/* Auth Buttons - Mobile */}
            {!userProfile && location.pathname === '/' && (
              <div className="space-y-2 px-4 pt-2">
                <Button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/signup');
                  }}
                  size="md"
                  fullWidth
                  className="glow-supernova"
                >
                  SIGN UP
                </Button>
                <Button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  variant="ghost"
                  size="md"
                  fullWidth
                  className="text-guardian hover:text-supernova"
                >
                  SIGN IN
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};