import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-supernova hover:bg-supernova-light text-shadowforce font-bold shadow-lg hover:shadow-xl hover:glow-supernova',
  secondary: 'bg-shadowforce-light hover:bg-guardian/20 text-white-knight shadow-md border border-guardian/30',
  outline: 'bg-transparent border-2 border-supernova text-supernova hover:bg-supernova hover:text-shadowforce font-semibold',
  ghost: 'bg-transparent hover:bg-shadowforce-light text-guardian hover:text-supernova',
  success: 'bg-green-600 hover:bg-green-500 text-white-knight shadow-lg',
  warning: 'bg-orange-600 hover:bg-orange-500 text-white-knight shadow-lg',
  error: 'bg-red-600 hover:bg-red-500 text-white-knight shadow-lg'
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-lg',
  lg: 'px-8 py-4 text-lg rounded-xl'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      className={`
        font-jakarta font-semibold focus:outline-none focus:ring-4 focus:ring-supernova/50
        transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isLoading || disabled ? 'opacity-70 cursor-not-allowed transform-none hover:scale-100' : ''}
        ${className}
      `}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full border-b-2 border-current h-5 w-5 mr-3"></div>
          <span>Loading...</span>
        </div>
      ) : children}
    </button>
  );
};