import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { AdminStats } from './AdminStats';
import { JobManagement } from './JobManagement';
import { ClientManagement } from './ClientManagement';
import { SourcerManagement } from './SourcerManagement';
import { SystemControls } from './SystemControls';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { Zap, BarChart3, Users, Briefcase, Settings, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';

export const AdminDashboard: React.FC = () => {
  const { jobs, candidates } = useData();
  const [activeTab, setActiveTab] = useState<'analytics' | 'jobs' | 'clients' | 'sourcers'>('analytics');

  const tabs = [
    { id: 'analytics', label: 'ANALYTICS', icon: TrendingUp },
    { id: 'jobs', label: 'JOBS', icon: Briefcase },
    { id: 'clients', label: 'USERS', icon: Users },
    { id: 'sourcers', label: 'SOURCERS', icon: Zap },
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'jobs':
        return <JobManagement />;
      case 'clients':
        return <ClientManagement />;
      case 'sourcers':
        return <SourcerManagement />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Zap size={60} className="text-supernova fill-current animate-pulse" />
              <div className="absolute inset-0 bg-supernova/30 blur-xl rounded-full"></div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-anton text-white-knight mb-4 text-center uppercase tracking-wide">
            ADMIN DASHBOARD
          </h1>
          <p className="text-xl text-guardian text-center font-jakarta max-w-2xl mx-auto">
            Monitor performance, manage jobs and users, oversee sourcing operations
          </p>
        </header>

        {/* Stats Overview */}
        <AdminStats jobs={jobs} />

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
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
        <div className="mb-12">
          {renderTabContent()}
        </div>

        {/* System Controls */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="text-supernova" size={24} />
            <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">System Controls</h2>
          </div>
          <SystemControls />
        </div>
      </div>
    </div>
  );
};