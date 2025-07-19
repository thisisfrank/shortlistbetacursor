import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { JobDetailModal } from '../sourcer/JobDetailModal';
import { Search, CalendarDays, Users, Filter, Trash2, Zap, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { clients, jobs, tiers, getTierById, deleteJob, deleteClient, updateJob } = useData();
  
  // Defensive programming: ensure arrays are defined
  const safeClients = clients || [];
  const safeJobs = jobs || [];
  const safeTiers = tiers || [];
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  
  // Get counts for dashboard
  const totalClients = safeClients.length;
  const totalJobs = safeJobs.length;
  const unclaimedJobs = safeJobs.filter(job => job.status === 'Unclaimed').length;
  const claimedJobs = safeJobs.filter(job => job.status === 'Claimed').length;
  const completedJobs = safeJobs.filter(job => job.status === 'Completed').length;
  
  // Get selected job and client
  const selectedJob = selectedJobId ? safeJobs.find(job => job.id === selectedJobId) || null : null;
  const client = selectedJob ? getClientById(selectedJob.userId) : null;
  
  // Filter jobs based on status and search
  const filteredJobs = safeJobs.filter(job => {
    // Filter by status
    if (statusFilter !== 'all' && job.status !== statusFilter) {
      return false;
    }
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      const client = getClientById(job.userId);
      
      return (
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        (client && client.companyName.toLowerCase().includes(searchLower)) ||
        (job.sourcerName && job.sourcerName.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
  
  // Sort jobs by date (newest first)
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const handleDeleteJob = (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      deleteJob(jobId).catch(error => {
        console.error('Error deleting job:', error);
        alert('Error deleting job. Please try again.');
      });
    }
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client and all associated jobs? This action cannot be undone.')) {
      deleteClient(clientId).catch(error => {
        console.error('Error deleting client:', error);
        alert('Error deleting client. Please try again.');
      });
    }
  };

  const handleCompleteJob = (jobId: string) => {
    if (window.confirm('Are you sure you want to mark this job as completed?')) {
      updateJob(jobId, { status: 'Completed' }).catch(error => {
        console.error('Error updating job:', error);
        alert('Error updating job. Please try again.');
      });
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
            ADMIN CONTROL
          </h1>
          <p className="text-xl text-guardian text-center font-jakarta max-w-2xl mx-auto">
            Monitor performance, manage clients and jobs, oversee sourcing operations
          </p>
        </header>
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-supernova/20 to-supernova/10 border-supernova/30 hover:border-supernova/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-anton text-lg text-supernova uppercase tracking-wide">Total Clients</h3>
                  <p className="text-3xl font-anton text-white-knight">{totalClients}</p>
                </div>
                <Users className="text-supernova" size={32} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30 hover:border-blue-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-anton text-lg text-blue-400 uppercase tracking-wide">Total Jobs</h3>
                  <p className="text-3xl font-anton text-white-knight">{totalJobs}</p>
                </div>
                <TrendingUp className="text-blue-400" size={32} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-500/10 border-orange-500/30 hover:border-orange-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-anton text-lg text-orange-400 uppercase tracking-wide">Unclaimed</h3>
                  <p className="text-3xl font-anton text-white-knight">{unclaimedJobs}</p>
                </div>
                <Clock className="text-orange-400" size={32} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30 hover:border-purple-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-anton text-lg text-purple-400 uppercase tracking-wide">In Progress</h3>
                  <p className="text-3xl font-anton text-white-knight">{claimedJobs}</p>
                </div>
                <Zap className="text-purple-400" size={32} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30 hover:border-green-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-anton text-lg text-green-400 uppercase tracking-wide">Completed</h3>
                  <p className="text-3xl font-anton text-white-knight">{completedJobs}</p>
                </div>
                <CheckCircle className="text-green-400" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Job List */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">Job Requests</h2>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-guardian" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search jobs or companies"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 block w-full rounded-lg border-guardian/30 bg-shadowforce text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <Filter size={18} className="text-guardian" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block rounded-lg border-guardian/30 bg-shadowforce text-white-knight focus:ring-supernova focus:border-supernova font-jakarta"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Unclaimed">Unclaimed</option>
                    <option value="Claimed">Claimed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-guardian/20">
                <thead className="bg-shadowforce">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Job
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Sourcer
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
                  {sortedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-guardian font-jakarta">
                        No jobs found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    sortedJobs.map(job => {
                      const jobClient = getClientById(job.userId);
                      return (
                        <tr key={job.id} className="hover:bg-shadowforce transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-jakarta font-bold text-white-knight">{job.title}</div>
                            <div className="text-sm text-guardian">{job.seniorityLevel} • {job.workArrangement}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white-knight font-jakarta font-semibold">{jobClient?.companyName}</div>
                            <div className="text-sm text-guardian">{jobClient?.contactName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={
                                job.status === 'Unclaimed' 
                                  ? 'warning' 
                                  : job.status === 'Completed' 
                                    ? 'success' 
                                    : 'default'
                              }
                            >
                              {job.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                            {job.sourcerName || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                            <div className="flex items-center">
                              <CalendarDays size={14} className="mr-2" />
                              {formatDate(job.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedJobId(job.id)}
                            >
                              VIEW
                            </Button>
                            {job.status === 'Claimed' && (
                              <Button 
                                variant="success" 
                                size="sm"
                                onClick={() => handleCompleteJob(job.id)}
                              >
                                COMPLETE
                              </Button>
                            )}
                            <Button 
                              variant="error" 
                              size="sm"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
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
        
        {/* Client List */}
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-anton text-white-knight mb-8 uppercase tracking-wide">Clients</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-guardian/20">
                <thead className="bg-shadowforce">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Jobs
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Joined
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
                  {safeClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-guardian font-jakarta">
                        No clients found.
                      </td>
                    </tr>
                  ) : (
                    safeClients.map(client => {
                      const clientJobs = safeJobs.filter(job => job.userId === client.id);
                      return (
                        <tr key={client.id} className="hover:bg-shadowforce transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-jakarta font-bold text-white-knight">{client.companyName}</div>
                            <div className="text-sm text-guardian">
                              {getTierById(client.tierId)?.name || 'Unknown Tier'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white-knight font-jakarta font-semibold">{client.contactName}</div>
                            <div className="text-sm text-guardian">{client.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white-knight font-jakarta">{client.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                            <div className="flex items-center">
                              <Users size={14} className="mr-2" />
                              {clientJobs.length}
                            </div>
                            <div className="text-xs text-guardian/60">
                              Credits: {client.availableCredits} | Jobs: {client.jobsRemaining}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                            {formatDate(client.createdAt)}
                            <div className="text-xs text-guardian/60">
                              Reset: {formatDate(client.creditsResetDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={client.hasReceivedFreeShortlist ? 'success' : 'outline'}>
                              {client.hasReceivedFreeShortlist ? 'Free Used' : 'New Client'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button 
                              variant="error" 
                              size="sm"
                              onClick={() => handleDeleteClient(client.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
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
        
        {selectedJob && client && (
          <JobDetailModal
            job={selectedJob}
            client={client}
            onClose={() => setSelectedJobId(null)}
          />
        )}
      </div>
    </div>
  );
};