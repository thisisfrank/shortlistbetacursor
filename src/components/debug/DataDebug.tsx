import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export const DataDebug: React.FC = () => {
  const { jobs, clients, candidates } = useData();
  const { user } = useAuth();

  if (import.meta.env.DEV) {
    return (
      <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
        <div className="mb-2 font-bold">🔍 Data Debug</div>
        <div>User: {user ? user.email : 'null'}</div>
        <div>Jobs: {jobs.length}</div>
        <div>Clients: {clients.length}</div>
        <div>Candidates: {candidates.length}</div>
        <div className="mt-2 text-yellow-400">
          {jobs.map(job => (
            <div key={job.id}>
              Job: {job.title} (Client: {job.clientId})
            </div>
          ))}
        </div>
        <div className="mt-2 text-green-400">
          {clients.map(client => (
            <div key={client.id}>
              Client: {client.email} ({client.companyName})
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}; 