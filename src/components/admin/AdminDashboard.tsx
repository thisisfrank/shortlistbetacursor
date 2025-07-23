import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { AdminStats } from './AdminStats';
import { JobManagement } from './JobManagement';
import { ClientManagement } from './ClientManagement';
import { SourcerManagement } from './SourcerManagement';
import { UserManagement } from './UserManagement';
import { SystemControls } from './SystemControls';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { BarChart3, Users, Briefcase, Settings, TrendingUp, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import BoltIcon from '../../assets/v2.png';

export const AdminDashboard: React.FC = () => {
  const { jobs, candidates, getCandidatesByJob } = useData();
  const [activeTab, setActiveTab] = useState<'analytics' | 'jobs' | 'clients' | 'sourcers' | 'users'>('analytics');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Calculate date range for filtering
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

  const tabs = [
    { id: 'analytics', label: 'ANALYTICS', icon: TrendingUp },
    { id: 'jobs', label: 'JOBS', icon: Briefcase },
    { id: 'clients', label: 'CLIENTS', icon: Users },
    { id: 'sourcers', label: 'SOURCERS', icon: BarChart3 },
    { id: 'users', label: 'USERS', icon: Shield },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <img
                src={BoltIcon}
                alt="Lightning Bolt"
                className="animate-pulse"
                style={{ width: '120px', height: '56px', filter: 'drop-shadow(0 0 10px #FFD600)', objectFit: 'contain' }}
              />
              <div className="absolute inset-0 bg-supernova/30 blur-xl"></div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-anton text-white-knight mb-4 text-center uppercase tracking-wide">
            ADMIN CONTROL
          </h1>
          <p className="text-xl text-guardian text-center font-jakarta max-w-2xl mx-auto">
            Monitor performance, manage clients and jobs, oversee sourcing operations
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-2 bg-shadowforce-light/50 rounded-xl p-2 border border-guardian/20">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'primary' : 'ghost'}
                  size="md"
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2"
                >
                  <Icon size={18} />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Time Range Selector */}
            <div className="flex justify-center">
              <div className="bg-shadowforce rounded-lg p-2 border border-guardian/20">
                <div className="flex space-x-1">
                  {(['7d', '30d', '90d', 'all'] as const).map(range => (
                    <Button
                      key={range}
                      variant={timeRange === range ? 'primary' : 'outline'}
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
            {/* Job Status Boxes */}
            <AdminStats jobs={filteredJobs} />
            <AnalyticsDashboard jobs={filteredJobs} candidates={candidates} getCandidatesByJob={getCandidatesByJob} timeRange={timeRange} setTimeRange={setTimeRange} />
          </div>
        )}
        {activeTab === 'jobs' && <JobManagement />}
        {activeTab === 'clients' && <ClientManagement />}
        {activeTab === 'sourcers' && <SourcerManagement />}
        {activeTab === 'users' && <UserManagement />}
      </div>
    </div>
  );
}