import React from 'react';
import { useJobTimer, getJobUrgencyLevel } from '../../hooks/useJobTimer';
import { Clock, AlertTriangle, Zap } from 'lucide-react';

interface JobTimerProps {
  jobCreatedAt: Date;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const JobTimer: React.FC<JobTimerProps> = ({ 
  jobCreatedAt, 
  className = '', 
  showIcon = true,
  size = 'md' 
}) => {
  const timer = useJobTimer(jobCreatedAt);
  const urgencyLevel = getJobUrgencyLevel(timer.hoursRemaining);

  const getTimerStyles = () => {
    switch (urgencyLevel) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'urgent':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-supernova bg-supernova/10 border-supernova/30';
    }
  };

  const getIconComponent = () => {
    switch (urgencyLevel) {
      case 'critical':
        return <AlertTriangle className="animate-pulse" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />;
      case 'urgent':
        return <Zap className="animate-pulse" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />;
      default:
        return <Clock size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-3 text-lg';
      default:
        return 'px-3 py-2 text-sm';
    }
  };

  if (timer.isExpired) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-lg border font-jakarta font-semibold ${getSizeClasses()} text-red-400 bg-red-500/10 border-red-500/30 ${className}`}>
        {showIcon && <AlertTriangle size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
        <span>EXPIRED</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border font-jakarta font-semibold ${getSizeClasses()} ${getTimerStyles()} ${className}`}>
      {showIcon && getIconComponent()}
      <span>{timer.formattedTime}</span>
    </div>
  );
};