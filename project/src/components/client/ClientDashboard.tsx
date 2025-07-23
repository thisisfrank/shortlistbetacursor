import React from 'react';
import { JobSubmissionView } from './JobSubmissionView';
import { CandidateViewer } from './CandidateViewer';

interface ClientDashboardProps {
  view: 'submit' | 'candidates';
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ view }) => {
  if (view === 'candidates') {
    return <CandidateViewer />;
  }
  
  return <JobSubmissionView />;
};