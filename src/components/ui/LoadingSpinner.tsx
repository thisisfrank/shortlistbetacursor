interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...',
  className = ''
}: LoadingSpinnerProps) => {
  const sizeClasses: Record<string, string> = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizes: Record<string, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-supernova ${sizeClasses[size]} mb-4`}></div>
      {text && (
        <p className={`text-guardian font-jakarta ${textSizes[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
}; 