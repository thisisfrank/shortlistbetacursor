import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSourcerAlerts } from '../../hooks/useSourcerAlerts';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { X, AlertTriangle, Clock, Zap, ExternalLink } from 'lucide-react';

export const SourcerAlerts: React.FC = () => {
  const { alerts, dismissAlert, clearAllAlerts, hasAlerts } = useSourcerAlerts();
  const navigate = useNavigate();

  if (!hasAlerts) return null;

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
    navigate('/sourcer');
    // The sourcer page will show all jobs, and they can find the specific one
  };

  return (
    <>
      <div className="mb-4 pb-4 border-b border-guardian/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-anton text-lg text-white-knight uppercase tracking-wide">
            Job Alerts
          </h3>
          <Badge variant="error" className="text-xs animate-pulse">
            {alerts.length} URGENT
          </Badge>
        </div>
        <p className="text-guardian font-jakarta text-sm mb-3">
          Jobs approaching their 24-hour deadline
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllAlerts}
          className="w-full text-xs"
        >
          DISMISS ALL
        </Button>
      </div>

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
                <Badge variant={getAlertBadgeVariant(alert.type)} className="text-xs">
                  {alert.hoursRemaining}H LEFT
                </Badge>
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
    </>
  );
};