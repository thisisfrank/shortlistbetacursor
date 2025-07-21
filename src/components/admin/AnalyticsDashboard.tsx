import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { TrendingUp, Calendar, Users, Briefcase, Target, Clock, DollarSign, Award } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { jobs, candidates, getCandidatesByJob } = useData();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

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

  const avgTimeToComplete = filteredJobs
    .filter(job => job.status === 'Completed')
    .reduce((acc, job) => {
      const created = new Date(job.createdAt).getTime();
      const updated = new Date(job.updatedAt).getTime();
      return acc + (updated - created);
    }, 0) / filteredJobs.filter(job => job.status === 'Completed').length;

  const avgDays = avgTimeToComplete ? Math.round(avgTimeToComplete / (1000 * 60 * 60 * 24)) : 0;

  // Sourcer performance
  const sourcerStats = filteredJobs
    .filter(job => job.sourcerName && job.status === 'Completed')
    .reduce((acc, job) => {
      const sourcer = job.sourcerName!;
      if (!acc[sourcer]) {
        acc[sourcer] = { completed: 0, candidates: 0 };
      }
      acc[sourcer].completed++;
      acc[sourcer].candidates += getCandidatesByJob(job.id).length;
      return acc;
    }, {} as Record<string, { completed: number; candidates: number }>);

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
    .filter(job => job.companyName) // Only jobs with company names
    .reduce((acc, job) => {
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
    }, {} as Record<string, { companyName: string; jobCount: number; candidateCount: number; completedJobs: number }>);

  const topCompanies = Object.values(companyActivity)
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex justify-center">
        <div className="bg-shadowforce rounded-lg p-2 border border-guardian/20">
          <div className="flex space-x-1">
            {(['7d', '30d', '90d', 'all'] as const).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-xs"
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-anton text-blue-400 uppercase tracking-wide">Completion Rate</h3>
                <p className="text-3xl font-anton text-white-knight">{completionRate}%</p>
              </div>
              <Target className="text-blue-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-500/10 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-anton text-orange-400 uppercase tracking-wide">Avg Candidates</h3>
                <p className="text-3xl font-anton text-white-knight">{avgCandidatesPerJob}</p>
              </div>
              <Users className="text-orange-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-anton text-purple-400 uppercase tracking-wide">Avg Days</h3>
                <p className="text-3xl font-anton text-white-knight">{avgDays}</p>
              </div>
              <Clock className="text-purple-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-anton text-green-400 uppercase tracking-wide">Total Jobs</h3>
                <p className="text-3xl font-anton text-white-knight">{filteredJobs.length}</p>
              </div>
              <Briefcase className="text-green-400" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Job Status Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">Job Status Distribution</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-guardian font-jakarta">Unclaimed</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-guardian/20 rounded-full h-2">
                    <div 
                      className="bg-orange-400 h-2 rounded-full" 
                      style={{ width: `${filteredJobs.length > 0 ? (statusDistribution.unclaimed / filteredJobs.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-white-knight font-jakarta font-semibold">{statusDistribution.unclaimed}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-guardian font-jakarta">In Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-guardian/20 rounded-full h-2">
                    <div 
                      className="bg-purple-400 h-2 rounded-full" 
                      style={{ width: `${filteredJobs.length > 0 ? (statusDistribution.claimed / filteredJobs.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-white-knight font-jakarta font-semibold">{statusDistribution.claimed}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-guardian font-jakarta">Completed</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-guardian/20 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full" 
                      style={{ width: `${filteredJobs.length > 0 ? (statusDistribution.completed / filteredJobs.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-white-knight font-jakarta font-semibold">{statusDistribution.completed}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Sourcers */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">Top Sourcers</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSourcers.length === 0 ? (
                <p className="text-guardian font-jakarta text-center">No sourcer activity in this period</p>
              ) : (
                topSourcers.map(([sourcer, stats], index) => (
                  <div key={sourcer} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-supernova/20 rounded-full flex items-center justify-center">
                        <span className="text-supernova font-anton text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-white-knight font-jakarta font-semibold">{sourcer}</p>
                        <p className="text-guardian text-sm">{stats.candidates} candidates</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white-knight font-anton">{stats.completed}</p>
                      <p className="text-guardian text-xs">completed</p>
                    </div>
                  </div>
                ))
              )}
            </div>
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
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
                {topCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-guardian font-jakarta">
                      No company activity in this period
                    </td>
                  </tr>
                ) : (
                  topCompanies.map(company => (
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
                        {company.completedJobs}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};