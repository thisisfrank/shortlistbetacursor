import { useState, useEffect } from 'react';

export interface JobTimer {
  timeRemaining: number; // milliseconds
  hoursRemaining: number;
  minutesRemaining: number;
  isExpired: boolean;
  isUrgent: boolean; // less than 2 hours
  isCritical: boolean; // less than 30 minutes
  formattedTime: string;
}

export const useJobTimer = (jobCreatedAt: Date): JobTimer => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const jobStartTime = new Date(jobCreatedAt).getTime();
  const deadline = jobStartTime + (24 * 60 * 60 * 1000); // 24 hours from job creation
  const timeRemaining = Math.max(0, deadline - currentTime);
  
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const secondsRemaining = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  const isExpired = timeRemaining <= 0;
  const isUrgent = timeRemaining <= (2 * 60 * 60 * 1000); // 2 hours
  const isCritical = timeRemaining <= (30 * 60 * 1000); // 30 minutes

  const formattedTime = isExpired 
    ? 'OVERDUE' 
    : `${hoursRemaining.toString().padStart(2, '0')}:${minutesRemaining.toString().padStart(2, '0')}:${secondsRemaining.toString().padStart(2, '0')}`;

  return {
    timeRemaining,
    hoursRemaining,
    minutesRemaining,
    isExpired,
    isUrgent,
    isCritical,
    formattedTime
  };
};

export const getJobUrgencyLevel = (hoursRemaining: number): 'normal' | 'warning' | 'urgent' | 'critical' => {
  if (hoursRemaining <= 0.5) return 'critical'; // 30 minutes
  if (hoursRemaining <= 2) return 'urgent';
  if (hoursRemaining <= 6) return 'warning';
  return 'normal';
};