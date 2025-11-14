import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SignOutLoading } from './SignOutLoading';

interface SignOutWrapperProps {
  children: React.ReactNode;
}

export const SignOutWrapper: React.FC<SignOutWrapperProps> = ({ children }) => {
  const { signOutLoading } = useAuth();

  if (signOutLoading) {
    return <SignOutLoading />;
  }

  return <>{children}</>;
}; 