import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSourcerAlerts } from '../../hooks/useSourcerAlerts';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { X, AlertTriangle, Clock, Zap, ExternalLink } from 'lucide-react';

export const SourcerAlerts: React.FC = () => {
  const {
    alerts,
    readAlerts,
    dismissAlert,
    clearAllAlerts,
    restoreReadAlerts,
    hasAlerts,
    hasReadAlerts
  } = useSourcerAlerts();
  const navigate = useNavigate();
  const [showRead, setShowRead] = useState(false);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="text-red-400 animate-pulse" size={16} />;
      case 'urgent':
        return <Zap className="text-orange-400 animate-pulse" size={16} />;
      default:
        return <Clock className="text-yellow-400" size={16} />;
    }
  };

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case 'critical':
        return 'error' as const;
      case 'urgent':
        return 'warning' as const;
      default:
        return 'outline' as const;
    }
  };

  const handleViewJob = (jobId: string) => {
    localStorage.setItem('sourcerSelectedJobId', jobId);
    window.dispatchEvent(new CustomEvent('openSourcerJob', { detail: jobId }));
    navigate('/sourcer');
  };

  return (
    <div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border transition-all duration-200 ${
              alert.type === 'critical' 
                ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' 
                : alert.type === 'urgent'
                  ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20'
                  : 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getAlertIcon(alert.type)}
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-guardian hover:text-red-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <h4 className="text-white-knight font-jakarta font-semibold text-sm mb-1 line-clamp-2">
              {alert.jobTitle}
            </h4>
            <p className={`font-jakarta text-xs mb-3 ${
              alert.type === 'critical' ? 'text-red-300' :
              alert.type === 'urgent' ? 'text-orange-300' : 'text-yellow-300'
            }`}>
              {alert.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewJob(alert.jobId)}
              className="w-full flex items-center justify-center gap-2 text-xs"
            >
              <ExternalLink size={12} />
              VIEW JOB
            </Button>
          </div>
        ))}
      </div>

      {hasReadAlerts && !showRead && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowRead(true)}
          >
            VIEW READ NOTIFICATIONS
          </Button>
        </div>
      )}

      {/* Only show Dismiss All when not viewing read notifications and there are alerts */}
      {!showRead && alerts.length > 0 && (
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllAlerts}
            className="w-full text-xs"
          >
            DISMISS ALL NOTIFICATIONS
          </Button>
        </div>
      )}

      {showRead && (
        <div className="mt-4">
          <h4 className="font-anton text-md text-guardian uppercase tracking-wide mb-2">Read Notifications</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {readAlerts.length === 0 && (
              <div className="text-guardian text-sm">No read notifications.</div>
            )}
            {readAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border transition-all duration-200 opacity-60 ${
                  alert.type === 'critical' 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : alert.type === 'urgent'
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getAlertIcon(alert.type)}
                </div>
                <h4 className="text-white-knight font-jakarta font-semibold text-sm mb-1 line-clamp-2">
                  {alert.jobTitle}
                </h4>
                <p className={`font-jakarta text-xs mb-3 ${
                  alert.type === 'critical' ? 'text-red-300' :
                  alert.type === 'urgent' ? 'text-orange-300' : 'text-yellow-300'
                }`}>
                  {alert.message}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewJob(alert.jobId)}
                  className="w-full flex items-center justify-center gap-2 text-xs"
                >
                  <ExternalLink size={12} />
                  VIEW JOB
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs mt-2"
            onClick={() => {
              setShowRead(false);
              restoreReadAlerts();
            }}
          >
            RESTORE ALL NOTIFICATIONS
          </Button>
        </div>
      )}
    </div>
  );
};