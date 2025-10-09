import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, style }) => {
  // If style is provided (for gradient borders), don't apply default border classes
  const defaultBorderClasses = style ? '' : 'border border-guardian/20 hover:border-supernova/30';
  
  return (
    <div 
      className={`bg-shadowforce-light rounded-xl shadow-2xl ${defaultBorderClasses} transition-all duration-300 ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-8 py-6 border-b border-guardian/20 ${className}`}>
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-8 py-6 ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-8 py-6 bg-shadowforce border-t border-guardian/20 rounded-b-xl ${className}`}>
      {children}
    </div>
  );
};