import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { JobDetailModal } from '../sourcer/JobDetailModal';
import { JobTimer } from '../ui/JobTimer';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FormInput, FormTextarea, FormSelect } from '../forms/FormInput';
import { Search, CalendarDays, Filter, Edit, X, Save, Briefcase, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const JobManagement: React.FC = () => {
  const { jobs, updateJob } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
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
  
  // Sort jobs by status (Unclaimed, Claimed, Completed), then by date (newest first)
  const statusOrder = { 'Unclaimed': 0, 'Claimed': 1, 'Completed': 2 };
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
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

  // Format date with time
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const handleEditJob = (job: any) => {
    setEditingJob(job);
    setShowEditModal(true);
    setEditForm({
      title: job.title,
      description: job.description,
      seniorityLevel: job.seniorityLevel,
      workArrangement: job.workArrangement,
      location: job.location,
      salaryRangeMin: job.salaryRangeMin?.toString() || '',
      salaryRangeMax: job.salaryRangeMax?.toString() || '',
      keySellingPoints: job.mustHaveSkills,
      candidatesRequested: job.candidatesRequested?.toString() || '3'
    });
  };

  const handleSaveJob = async () => {
    if (!editingJob) return;
    
    try {
      const updates = {
        title: editForm.title,
        description: editForm.description,
        seniorityLevel: editForm.seniorityLevel,
        workArrangement: editForm.workArrangement,
        location: editForm.location,
        salaryRangeMin: editForm.salaryRangeMin ? parseInt(editForm.salaryRangeMin) : undefined,
        salaryRangeMax: editForm.salaryRangeMax ? parseInt(editForm.salaryRangeMax) : undefined,
        mustHaveSkills: editForm.mustHaveSkills,
        candidatesRequested: parseInt(editForm.candidatesRequested)
      };
      
      await updateJob(editingJob.id, updates);
      setShowEditModal(false);
      setEditingJob(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Error updating job. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingJob(null);
    setEditForm({});
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-anton text-white-knight mb-2 uppercase tracking-wide">Job Management</h2>
          <p className="text-guardian font-jakarta">Manage and edit job submissions from all companies</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-guardian" />
            </div>
            <input
              type="text"
              placeholder=""
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

      {/* Job Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-supernova/20 to-supernova/10 border-supernova/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-supernova uppercase tracking-wide">Total Jobs</h3>
                <p className="text-3xl font-anton text-white-knight">{jobs.length}</p>
              </div>
              <Briefcase className="text-supernova" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-green-400 uppercase tracking-wide">Completion Rate</h3>
                <p className="text-3xl font-anton text-white-knight">
                  {jobs.length > 0 
                    ? Math.round((jobs.filter(job => job.status === 'Completed').length / jobs.length) * 100)
                    : 0}%
                </p>
              </div>
              <Target className="text-green-400" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Job List */}
      <Card>
        <CardContent className="p-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-guardian/20">
              <thead className="bg-shadowforce">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-anton text-guardian uppercase tracking-wider">
                    Job & Company
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-anton text-guardian uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-anton text-guardian uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-anton text-guardian uppercase tracking-wider">
                    Sourcer
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-anton text-guardian uppercase tracking-wider">
                    Date Submitted
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-anton text-guardian uppercase tracking-wider">
                    Date Complete
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-anton text-guardian uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
                {sortedJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-guardian font-jakarta">
                      No jobs found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  sortedJobs.map(job => {
                    return (
                      <tr key={job.id} className="hover:bg-shadowforce transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <button
                                className="text-sm font-jakarta font-bold text-supernova underline hover:text-supernova/80 cursor-pointer bg-transparent border-none p-0 m-0"
                                style={{ background: 'none' }}
                                onClick={() => setSelectedJobId(job.id)}
                              >
                                {job.title}
                              </button>
                              <div className="text-sm text-guardian font-jakarta">{job.companyName}</div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-guardian font-jakarta">
                            {job.userEmail || 'Unknown'}
                          </div>
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
                            {formatDateTime(job.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-guardian font-jakarta">
                            {job.status === 'Completed' && job.updatedAt ? formatDateTime(job.updatedAt) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => handleEditJob(job)}
                              variant="outline"
                              size="sm"
                              className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                            >
                              <Edit size={16} />
                            </Button>
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
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJobId(null)}
          onClaim={() => {
            // Handle claim logic here if needed
            setSelectedJobId(null);
          }}
        />
      )}

      {/* Edit Job Modal */}
      {showEditModal && editingJob && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-shadowforce-light rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-guardian/20">
            <div className="flex justify-between items-center border-b border-guardian/20 p-6">
              <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">Edit Job</h2>
              <button 
                onClick={handleCancelEdit}
                className="text-guardian hover:text-supernova transition-colors"
                aria-label="Close"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-8" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-jakarta font-semibold text-guardian mb-2 uppercase tracking-wide">
                    Position Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full bg-shadowforce border border-guardian/30 rounded-lg px-4 py-3 text-white-knight focus:ring-supernova focus:border-supernova font-jakarta"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-jakarta font-semibold text-guardian mb-2 uppercase tracking-wide">
                    Job Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={6}
                    className="w-full bg-shadowforce border border-guardian/30 rounded-lg px-4 py-3 text-white-knight focus:ring-supernova focus:border-supernova font-jakarta resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-jakarta font-semibold text-guardian mb-2 uppercase tracking-wide">
                      Seniority Level
                    </label>
                    <select
                      value={editForm.seniorityLevel}
                      onChange={(e) => handleFormChange('seniorityLevel', e.target.value)}
                      className="w-full bg-shadowforce border border-guardian/30 rounded-lg px-4 py-3 text-white-knight focus:ring-supernova focus:border-supernova font-jakarta"
                    >
                      <option value="1-3 years">1-3 years</option>
                      <option value="4-6 years">4-6 years</option>
                      <option value="7-10 years">7-10 years</option>
                      <option value="10+ years">10+ years</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-jakarta font-semibold text-guardian mb-2 uppercase tracking-wide">
                      Work Arrangement
                    </label>
                    <select
                      value={editForm.workArrangement}
                      onChange={(e) => handleFormChange('workArrangement', e.target.value)}
                      className="w-full bg-shadowforce border border-guardian/30 rounded-lg px-4 py-3 text-white-knight focus:ring-supernova focus:border-supernova font-jakarta"
                    >
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-jakarta font-semibold text-guardian mb-2 uppercase tracking-wide">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    className="w-full bg-shadowforce border border-guardian/30 rounded-lg px-4 py-3 text-white-knight focus:ring-supernova focus:border-supernova font-jakarta"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-jakarta font-semibold text-guardian mb-2 uppercase tracking-wide">
                      Min Salary
                    </label>
                    <input
                      type="number"
                      value={editForm.salaryRangeMin}
                      onChange={(e) => handleFormChange('salaryRangeMin', e.target.value)}
                      className="w-full bg-shadowforce border border-guardian/30 rounded-lg px-4 py-3 text-white-knight focus:ring-supernova focus:border-supernova font-jakarta"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-jakarta font-semibold text-guardian mb-2 uppercase tracking-wide">
                      Max Salary
                    </label>
                    <input
                      type="number"
                      value={editForm.salaryRangeMax}
                      onChange={(e) => handleFormChange('salaryRangeMax', e.target.value)}
                      className="w-full bg-shadowforce border border-guardian/30 rounded-lg px-4 py-3 text-white-knight focus:ring-supernova focus:border-supernova font-jakarta"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-jakarta font-semibold text-guardian mb-2 uppercase tracking-wide">
                    Candidates Requested
                  </label>
                  <input
                    type="number"
                    value={editForm.candidatesRequested}
                    onChange={(e) => handleFormChange('candidatesRequested', e.target.value)}
                    className="w-full bg-shadowforce border border-guardian/30 rounded-lg px-4 py-3 text-white-knight focus:ring-supernova focus:border-supernova font-jakarta"
                  />
                </div>
                
                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveJob}
                    variant="success"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Save size={18} />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};