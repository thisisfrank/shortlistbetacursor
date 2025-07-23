import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Users, Briefcase, Target, Clock } from 'lucide-react';
import { Job, Candidate } from '../../types';

interface AnalyticsDashboardProps {
  jobs: Job[];
  candidates: Candidate[];
  getCandidatesByJob: (jobId: string) => Candidate[];
  timeRange: '7d' | '30d' | '90d' | 'all';
  setTimeRange: (range: '7d' | '30d' | '90d' | 'all') => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ jobs, candidates, getCandidatesByJob, timeRange, setTimeRange }) => {
  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const ranges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      'all': new Date(0)
    };
    return ranges[timeRange];
  };
  const startDate = getDateRange();
  const filteredJobs = jobs.filter(job => new Date(job.createdAt) >= startDate);
  const filteredCandidates = candidates.filter(candidate => new Date(candidate.submittedAt) >= startDate);

  // Performance metrics
  const completionRate = filteredJobs.length > 0 
    ? Math.round((filteredJobs.filter(job => job.status === 'Completed').length / filteredJobs.length) * 100)
    : 0;

  const avgCandidatesPerJob = filteredJobs.length > 0
    ? Math.round(filteredCandidates.length / filteredJobs.length)
    : 0;

  // Calculate average time to complete in ms
  const avgTimeToComplete = filteredJobs
    .filter(job => job.status === 'Completed')
    .reduce((acc, job) => {
      const created = new Date(job.createdAt).getTime();
      const updated = new Date(job.updatedAt).getTime();
      return acc + (updated - created);
    }, 0) / filteredJobs.filter(job => job.status === 'Completed').length;

  // Convert ms to hours and minutes
  let avgTimeDisplay = '0h 0m';
  if (avgTimeToComplete && !isNaN(avgTimeToComplete)) {
    const totalMinutes = Math.round(avgTimeToComplete / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    avgTimeDisplay = `${hours}h ${minutes}m`;
  }

  // Sourcer performance
  const sourcerStats = filteredJobs
    .filter(job => job.sourcerName && job.status === 'Completed')
    .reduce((acc: Record<string, { completed: number; candidates: number }>, job) => {
      const sourcer = job.sourcerName!;
      if (!acc[sourcer]) {
        acc[sourcer] = { completed: 0, candidates: 0 };
      }
      acc[sourcer].completed++;
      acc[sourcer].candidates += getCandidatesByJob(job.id).length;
      return acc;
    }, {});

  const topSourcers = Object.entries(sourcerStats)
    .sort(([, a], [, b]) => b.completed - a.completed)
    .slice(0, 5);

  // Job status distribution
  const statusDistribution = {
    unclaimed: filteredJobs.filter(job => job.status === 'Unclaimed').length,
    claimed: filteredJobs.filter(job => job.status === 'Claimed').length,
    completed: filteredJobs.filter(job => job.status === 'Completed').length,
  };

  // Company activity (replaced client activity)
  const companyActivity = jobs
    .filter(job => job.companyName)
    .reduce((acc: Record<string, { companyName: string; jobCount: number; candidateCount: number; completedJobs: number }>, job) => {
      const company = job.companyName!;
      if (!acc[company]) {
        acc[company] = {
          companyName: company,
          jobCount: 0,
          candidateCount: 0,
          completedJobs: 0
        };
      }
      acc[company].jobCount++;
      acc[company].candidateCount += getCandidatesByJob(job.id).length;
      if (job.status === 'Completed') {
        acc[company].completedJobs++;
      }
      return acc;
    }, {});

  const topCompanies = Object.values(companyActivity)
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-blue-500/30 col-span-2">
          <CardContent className="p-6">
            <div>
              <div>
                <h3 className="text-lg font-anton text-white uppercase tracking-wide">Total Job Completion Rate</h3>
                <p className="text-3xl font-anton text-white-knight">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="p-6">
            <div>
              <div>
                <h3 className="text-lg font-anton text-white uppercase tracking-wide">Average Completion Time</h3>
                <p className="text-3xl font-anton text-white-knight">{avgTimeDisplay}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 gap-8">
        {/* Top Sourcers */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">Top Sourcers</h3>
          </CardHeader>
          <CardContent>
            {topSourcers.length === 0 ? (
              <p className="text-guardian font-jakarta">No sourcer activity found.</p>
            ) : (
              <div className="space-y-4">
                {topSourcers.slice(0, 3).map(([sourcer, stats], index) => (
                  <div key={sourcer} className="flex items-center justify-between p-4 bg-shadowforce rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' : 
                        index === 1 ? 'bg-gray-400 text-black' : 
                        'bg-orange-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-jakarta font-semibold text-white-knight">{sourcer}</p>
                        <p className="text-sm text-guardian">{stats.completed} jobs completed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-anton text-supernova">{stats.completed}</p>
                      <p className="text-xs text-guardian">completed</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Company Activity */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">Top Companies</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-guardian/20">
              <thead className="bg-shadowforce">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Jobs
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Candidates
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Candidates/Job
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
                {topCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-guardian font-jakarta">
                      No company activity in this period
                    </td>
                  </tr>
                ) : (
                  topCompanies.map((company, idx) => {
                    const candidatesPerJob = company.jobCount > 0 ? (company.candidateCount / company.jobCount) : 0;
                    return (
                      <tr key={company.companyName} className="hover:bg-shadowforce transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-jakarta font-bold text-white-knight">{company.companyName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          {company.jobCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          {company.candidateCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          {Math.round(candidatesPerJob)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          {company.completedJobs}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};