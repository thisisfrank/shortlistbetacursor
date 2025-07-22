import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export interface SourcerAlert {
  id: string;
  jobId: string;
  jobTitle: string;
  hoursRemaining: number;
  type: 'warning' | 'urgent' | 'critical';
  message: string;
  timestamp: Date;
}

const DISMISSED_ALERTS_KEY = 'sourcerDismissedAlerts';

export const useSourcerAlerts = () => {
  const { jobs } = useData();
  const { userProfile } = useAuth();
  const [alerts, setAlerts] = useState<SourcerAlert[]>([]);
  const [readAlerts, setReadAlerts] = useState<SourcerAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    // Only show alerts for sourcers
    if (!userProfile || userProfile.role !== 'sourcer') {
      setAlerts([]);
      setReadAlerts([]);
      return;
    }

    const now = Date.now();
    const newAlerts: SourcerAlert[] = [];
    const newReadAlerts: SourcerAlert[] = [];

    // Check all uncompleted jobs for time-based alerts
    const activeJobs = jobs.filter(job => job.status !== 'Completed');

    activeJobs.forEach(job => {
      const jobStartTime = new Date(job.createdAt).getTime();
      const deadline = jobStartTime + (24 * 60 * 60 * 1000);
      const timeRemaining = deadline - now;
      const hoursRemaining = timeRemaining / (1000 * 60 * 60);

      // Alert thresholds: 12 hours, 6 hours, 2 hours
      let shouldAlert = false;
      let alertType: 'warning' | 'urgent' | 'critical' = 'warning';
      let message = '';

      if (hoursRemaining <= 2 && hoursRemaining > 0) {
        shouldAlert = true;
        alertType = 'critical';
        message = `URGENT: Only ${Math.floor(hoursRemaining)} hours left to complete this job!`;
      } else if (hoursRemaining <= 6 && hoursRemaining > 2) {
        shouldAlert = true;
        alertType = 'urgent';
        message = `${Math.floor(hoursRemaining)} hours remaining to complete this job`;
      } else if (hoursRemaining <= 12 && hoursRemaining > 6) {
        shouldAlert = true;
        alertType = 'warning';
        message = `${Math.floor(hoursRemaining)} hours left to complete this job`;
      }

      if (shouldAlert) {
        const alertId = `${job.id}-${Math.floor(hoursRemaining)}h`;
        const alertObj: SourcerAlert = {
          id: alertId,
          jobId: job.id,
          jobTitle: job.title,
          hoursRemaining: Math.floor(hoursRemaining),
          type: alertType,
          message,
          timestamp: new Date()
        };
        if (!dismissedAlerts.has(alertId)) {
          newAlerts.push(alertObj);
        } else {
          newReadAlerts.push(alertObj);
        }
      }
    });

    setAlerts(newAlerts);
    setReadAlerts(newReadAlerts);
  }, [jobs, userProfile, dismissedAlerts]);

  // Persist dismissed alerts in localStorage
  useEffect(() => {
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(Array.from(dismissedAlerts)));
  }, [dismissedAlerts]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const clearAllAlerts = () => {
    const allAlertIds = alerts.map(alert => alert.id);
    setDismissedAlerts(prev => new Set([...prev, ...allAlertIds]));
  };

  const restoreReadAlerts = () => {
    setDismissedAlerts(new Set());
  };

  return {
    alerts,
    readAlerts,
    dismissAlert,
    clearAllAlerts,
    restoreReadAlerts,
    hasAlerts: alerts.length > 0,
    hasReadAlerts: readAlerts.length > 0,
    criticalAlerts: alerts.filter(alert => alert.type === 'critical').length,
    urgentAlerts: alerts.filter(alert => alert.type === 'urgent').length
  };
};