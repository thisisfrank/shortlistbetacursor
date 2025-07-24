import React from 'react';
import { AlertTriangle, Crown, X } from 'lucide-react';
import { Button } from './Button';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'warning' | 'error' | 'upgrade';
  actionLabel?: string;
  onAction?: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'warning',
  actionLabel,
  onAction
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'upgrade':
        return <Crown size={32} className="text-supernova" />;
      case 'error':
        return <AlertTriangle size={32} className="text-red-500" />;
      default:
        return <AlertTriangle size={32} className="text-supernova" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'upgrade':
        return 'from-supernova/20 to-supernova/10 border-supernova/30';
      case 'error':
        return 'from-red-500/20 to-red-500/10 border-red-500/30';
      default:
        return 'from-supernova/20 to-supernova/10 border-supernova/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-shadowforce/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative max-w-md w-full mx-4 bg-shadowforce-light rounded-xl shadow-2xl border ${getGradient()} transform transition-all duration-300 scale-100`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-guardian hover:text-white-knight transition-colors duration-200"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {getIcon()}
              <div className="absolute inset-0 bg-supernova/30 blur-lg rounded-full"></div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-anton text-white-knight text-center mb-4 uppercase tracking-wide">
            {title}
          </h2>

          {/* Message */}
          <p className="text-guardian font-jakarta text-center leading-relaxed mb-8">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            {actionLabel && onAction && (
              <Button
                variant="primary"
                onClick={() => {
                  onAction();
                  onClose();
                }}
                className="glow-supernova"
              >
                {actionLabel}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={onClose}
            >
              {actionLabel ? 'Cancel' : 'OK'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 