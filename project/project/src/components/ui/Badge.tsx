import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-supernova text-shadowforce font-bold',
  success: 'bg-green-500 text-white-knight font-semibold',
  warning: 'bg-orange-500 text-white-knight font-semibold',
  error: 'bg-red-500 text-white-knight font-semibold',
  outline: 'bg-transparent border-2 border-guardian text-guardian font-medium'
};

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  children, 
  className = '' 
}) => {
  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-jakarta uppercase tracking-wide ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};