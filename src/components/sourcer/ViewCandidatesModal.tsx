import React, { useState } from 'react';
import { Job, Candidate } from '../../types';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/Button';
import { X, ExternalLink, Trash2, CheckCircle } from 'lucide-react';

interface ViewCandidatesModalProps {
  job: Job;
  onClose: () => void;
}

export const ViewCandidatesModal: React.FC<ViewCandidatesModalProps> = ({ job, onClose }) => {
  const { getCandidatesByJob, deleteCandidate } = useData();
  const [deletingCandidateId, setDeletingCandidateId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const candidates = getCandidatesByJob(job.id);
  const progressPercentage = Math.min((candidates.length / job.candidatesRequested) * 100, 100);
  const isComplete = candidates.length >= job.candidatesRequested;

  const handleDeleteCandidate = async (candidateId: string, candidateName: string) => {
    if (!confirm(`Remove ${candidateName} from this job?`)) {
      return;
    }

    setDeletingCandidateId(candidateId);
    setError('');

    try {
      const success = await deleteCandidate(candidateId);

      if (success) {
        setSuccessMessage(`✅ ${candidateName} removed successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to remove candidate. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while removing the candidate.');
    } finally {
      setDeletingCandidateId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-shadowforce-light rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-guardian/20">
        <div className="flex justify-between items-center border-b border-guardian/20 p-6">
          <div>
            <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">View Candidates</h2>
            <p className="text-sm text-guardian font-jakarta mt-1">{job.title} • {job.companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-guardian hover:text-supernova transition-colors"
            aria-label="Close"
          >
            <X size={28} />
          </button>
        </div>

        <div className="overflow-y-auto p-8" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-lg font-anton text-white-knight uppercase tracking-wide">
                Job Progress
              </h5>
              <span className={`text-sm font-jakarta flex items-center gap-2 ${isComplete ? 'text-green-400 font-semibold' : 'text-guardian'}`}>
                {isComplete && <CheckCircle size={16} />}
                {candidates.length} / {job.candidatesRequested} candidates
              </span>
            </div>
            <div className="w-full bg-shadowforce rounded-full h-4 mb-2 border border-green-500/30">
              <div
                className="h-4 rounded-full bg-green-400 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 font-jakarta text-sm">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 font-jakarta text-sm">{error}</p>
            </div>
          )}

          {/* Candidates Table */}
          {candidates.length > 0 ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-xl font-anton text-white-knight uppercase tracking-wide">
                  Submitted Candidates
                </h5>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-guardian/20">
                      <th className="text-left py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide w-[50%]">Name</th>
                      <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide w-[25%]">LinkedIn</th>
                      <th className="text-center py-3 px-4 text-sm font-anton font-normal text-guardian uppercase tracking-wide w-[25%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((candidate) => (
                      <tr key={candidate.id} className="border-b border-guardian/10 hover:bg-shadowforce/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-white-knight font-jakarta text-sm">
                            {candidate.firstName} {candidate.lastName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <a
                            href={candidate.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-supernova hover:text-supernova-light font-jakarta text-sm inline-flex items-center gap-1"
                          >
                            View <ExternalLink size={12} />
                          </a>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteCandidate(candidate.id, `${candidate.firstName} ${candidate.lastName}`)}
                            disabled={deletingCandidateId === candidate.id}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove candidate"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-guardian font-jakarta text-lg">No candidates submitted yet</p>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end mt-6">
            <Button
              variant="outline"
              onClick={onClose}
            >
              CLOSE
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

