import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { TrendingUp, Calendar, Users, Briefcase, Target, Clock, DollarSign, Award } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { jobs, clients, candidates, getCandidatesByJob } = useData();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  // Defensive programming: ensure arrays are defined
  const safeJobs = jobs || [];
  const safeClients = clients || [];
  const safeCandidates = candidates || [];

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
  const filteredJobs = safeJobs.filter(job => new Date(job.createdAt) >= startDate);
  const filteredClients = safeClients.filter(client => new Date(client.createdAt) >= startDate);
  const filteredCandidates = safeCandidates.filter(candidate => new Date(candidate.submittedAt) >= startDate);

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

  // Client activity
  const clientActivity = safeClients.map(client => {
    const clientJobs = safeJobs.filter(job => job.userId === client.id);
    const clientCandidates = safeCandidates.filter(candidate => {
      const job = safeJobs.find(j => j.id === candidate.jobId);
      return job && job.userId === client.id;
    });
    
    return {
      ...client,
      jobCount: clientJobs.length,
      candidateCount: clientCandidates.length,
      completedJobs: clientJobs.filter(job => job.status === 'Completed').length
    };
  }).sort((a, b) => b.jobCount - a.jobCount).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex justify-center">
        <div className="flex gap-2 bg-shadowforce-light/50 rounded-xl p-2 border border-guardian/20">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
            { value: 'all', label: 'All Time' }
          ].map((option) => (
            <Button
              key={option.value}
              variant={timeRange === option.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(option.value as any)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-green-400 uppercase tracking-wide">Completion Rate</h3>
                <p className="text-3xl font-anton text-white-knight">{completionRate}%</p>
              </div>
              <Target className="text-green-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-blue-400 uppercase tracking-wide">Avg Candidates/Job</h3>
                <p className="text-3xl font-anton text-white-knight">{avgCandidatesPerJob}</p>
              </div>
              <Users className="text-blue-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-purple-400 uppercase tracking-wide">Avg Time to Complete</h3>
                <p className="text-3xl font-anton text-white-knight">{avgDays}d</p>
              </div>
              <Clock className="text-purple-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-supernova/20 to-supernova/10 border-supernova/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-supernova uppercase tracking-wide">Active Sourcers</h3>
                <p className="text-3xl font-anton text-white-knight">{Object.keys(sourcerStats).length}</p>
              </div>
              <Award className="text-supernova" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
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
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-shadowforce rounded-full h-3">
                    <div 
                      className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${filteredJobs.length > 0 ? (statusDistribution.unclaimed / filteredJobs.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-white-knight font-anton w-8">{statusDistribution.unclaimed}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-guardian font-jakarta">In Progress</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-shadowforce rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${filteredJobs.length > 0 ? (statusDistribution.claimed / filteredJobs.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-white-knight font-anton w-8">{statusDistribution.claimed}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-guardian font-jakarta">Completed</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-shadowforce rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${filteredJobs.length > 0 ? (statusDistribution.completed / filteredJobs.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-white-knight font-anton w-8">{statusDistribution.completed}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Sourcers */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">Top Performing Sourcers</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSourcers.length > 0 ? (
                topSourcers.map(([sourcer, stats], index) => (
                  <div key={sourcer} className="flex items-center justify-between p-3 bg-shadowforce rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-supernova rounded-full flex items-center justify-center">
                        <span className="text-shadowforce font-anton text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-white-knight font-jakarta font-semibold">{sourcer}</p>
                        <p className="text-guardian font-jakarta text-sm">{stats.candidates} candidates sourced</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-supernova font-anton text-lg">{stats.completed}</p>
                      <p className="text-guardian font-jakarta text-xs">jobs completed</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-guardian font-jakarta text-center py-8">No sourcer activity in this period</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Most Active Clients */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">Most Active Clients</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientActivity.length > 0 ? (
                clientActivity.map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-shadowforce rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-anton text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-white-knight font-jakarta font-semibold">{client.companyName}</p>
                        <p className="text-guardian font-jakarta text-sm">{client.contactName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 font-anton text-lg">{client.jobCount}</p>
                      <p className="text-guardian font-jakarta text-xs">jobs posted</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-guardian font-jakarta text-center py-8">No client activity found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}