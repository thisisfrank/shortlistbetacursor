import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { ViewJobDetailsModal } from '../sourcer/ViewJobDetailsModal';
import { Search, CalendarDays, Users, Filter, Zap, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ghlService } from '../../services/ghlService';

export const AdminPanel: React.FC = () => {
  const { jobs, tiers, getTierById, updateJob, getUserProfileById } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sourcerNames, setSourcerNames] = useState<Record<string, string>>({});
  
  // Load sourcer names from user_profiles
  useEffect(() => {
    const loadSourcerNames = async () => {
      try {
        const sourcerIds = [...new Set(jobs.filter(job => job.sourcerId).map(job => job.sourcerId!))];
        if (sourcerIds.length === 0) return;

        // Query for specific sourcer IDs instead of filtering by role
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('id, name')
          .in('id', sourcerIds);

        if (!error && profiles) {
          const nameMap: Record<string, string> = {};
          profiles.forEach((profile: any) => {
            nameMap[profile.id] = profile.name || 'Unknown Sourcer';
          });
          setSourcerNames(nameMap);
        } else {
          console.error('Error loading sourcer profiles:', error);
        }
      } catch (error) {
        console.error('Error loading sourcer names:', error);
        // Don't throw - just continue with IDs if names fail to load
      }
    };

    if (jobs.length > 0) {
      loadSourcerNames();
    }
  }, [jobs]);

  // Get sourcer name by ID
  const getSourcerName = (sourcerId: string): string => {
    return sourcerNames[sourcerId] || `Sourcer ${sourcerId.substring(0, 8)}...`;
  };
  
  // Get counts for dashboard - removed clients references
  const totalJobs = jobs.length;
  const unclaimedJobs = jobs.filter(job => job.status === 'Unclaimed').length;
  const claimedJobs = jobs.filter(job => job.status === 'Claimed').length;
  const completedJobs = jobs.filter(job => job.status === 'Completed').length;
  
  // Get selected job - removed client lookup since company info is in job
  const selectedJob = selectedJobId ? jobs.find(job => job.id === selectedJobId) || null : null;
  
  // Filter jobs based on status and search
  const filteredJobs = jobs.filter(job => {
    // Filter by status
    if (statusFilter !== 'all' && job.status !== statusFilter) {
      return false;
    }
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      
      return (
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        (job.companyName && job.companyName.toLowerCase().includes(searchLower)) ||
        (job.sourcerId && job.sourcerId.toLowerCase().includes(searchLower))
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

  const handleCompleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to mark this job as completed?')) {
      try {
        // Get the job details
        const job = jobs.find(j => j.id === jobId);
        if (!job) {
          console.error('Job not found for completion:', jobId);
          return;
        }

        // Fetch fresh candidates from database
        const { data: candidates, error: candidatesError } = await supabase
          .from('candidates')
          .select('*')
          .eq('job_id', jobId);
        
        if (candidatesError) {
          console.error('⚠️ Failed to fetch candidates for webhook:', candidatesError);
        }
        
        console.log(`📊 [Admin] Found ${candidates?.length || 0} candidates for job ${jobId}`);
        
        // Get the user profile of the person who submitted the job
        const userProfile = await getUserProfileById(job.userId);
        
        if (!userProfile) {
          console.error('⚠️ User profile not found for webhook. User ID:', job.userId);
        }
        
        // Update job status
        await updateJob(jobId, { status: 'Completed' });
        
        // Send job completion notification to GoHighLevel
        try {
          if (!userProfile) {
            console.warn('⚠️ Skipping GHL webhook: User profile is null');
          } else if (!candidates || candidates.length === 0) {
            console.warn('⚠️ [Admin] Sending GHL webhook with 0 candidates');
            await ghlService.sendJobCompletionNotification(job, userProfile, candidates || []);
            console.log('✅ [Admin] Job completion notification sent to GHL (0 candidates)');
          } else {
            await ghlService.sendJobCompletionNotification(job, userProfile, candidates);
            console.log(`✅ [Admin] Job completion notification sent to GHL for ${candidates.length} candidates`);
          }
        } catch (ghlError) {
          console.error('❌ [Admin] GHL Job Completion Notification webhook FAILED:', ghlError);
        }
      } catch (error) {
        console.error('Error updating job:', error);
        alert('Error updating job. Please try again.');
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <img
                src="/screenshots/v2.png"
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
            Monitor performance, manage jobs, oversee sourcing operations
          </p>
        </header>
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
                    className="rounded-lg border-guardian/30 bg-shadowforce text-white-knight focus:ring-supernova focus:border-supernova font-jakarta"
                  >
                    <option value="all">All Jobs</option>
                    <option value="Unclaimed">Unclaimed</option>
                    <option value="Claimed">In Progress</option>
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
                      Job Details
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
                      return (
                        <tr key={job.id} className="hover:bg-shadowforce transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-jakarta font-bold text-white-knight">{job.title}</div>
                            <div className="text-sm text-guardian">{job.seniorityLevel} • {job.workArrangement}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white-knight font-jakarta font-semibold">{job.companyName}</div>
                            <div className="text-sm text-guardian">{job.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={job.status === 'Completed' ? 'success' : job.status === 'Claimed' ? 'warning' : 'default'}
                            >
                              {job.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white-knight font-jakarta">
                              {job.sourcerId ? getSourcerName(job.sourcerId) : 'Unassigned'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-guardian font-jakarta">
                              {formatDate(job.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => setSelectedJobId(job.id)}
                                variant="outline"
                                size="sm"
                              >
                                View
                              </Button>
                              {job.status !== 'Completed' && (
                                <Button
                                  onClick={() => handleCompleteJob(job.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
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
        
        {/* Job Detail Modal */}
        {selectedJob && (
          <ViewJobDetailsModal
            job={selectedJob}
            onClose={() => setSelectedJobId(null)}
          />
        )}
      </div>
    </div>
  );
};