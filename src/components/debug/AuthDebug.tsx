import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const AuthDebug: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  
  if (import.meta.env.DEV) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
        <div className="mb-2 font-bold">🔍 Auth Debug</div>
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>User: {user ? user.email : 'null'}</div>
        <div>Profile: {userProfile ? `${userProfile.role} (${userProfile.email})` : 'null'}</div>
        <div>Env Vars: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}</div>
      </div>
    );
  }
  
  return null;
}; 