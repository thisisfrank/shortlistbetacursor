import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { JobDetailModal } from '../sourcer/JobDetailModal';
import { JobTimer } from '../ui/JobTimer';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FormInput, FormTextarea, FormSelect } from '../forms/FormInput';
import { Search, CalendarDays, Filter, Trash2, Edit, X, Save } from 'lucide-react';

export const JobManagement: React.FC = () => {
  const { jobs, deleteJob, updateJob } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
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
      deleteJob(jobId);
    }
  };

  const handleEditJob = (job: any) => {
    setEditingJobId(job.id);
    setEditForm({
      title: job.title,
      description: job.description,
      seniorityLevel: job.seniorityLevel,
      workArrangement: job.workArrangement,
      location: job.location,
      salaryRangeMin: job.salaryRangeMin?.toString() || '',
      salaryRangeMax: job.salaryRangeMax?.toString() || '',
      keySellingPoints: job.keySellingPoints,
      candidatesRequested: job.candidatesRequested?.toString() || '3'
    });
  };

  const handleSaveJob = async () => {
    if (!editingJobId) return;
    
    try {
      const updates = {
        title: editForm.title,
        description: editForm.description,
        seniorityLevel: editForm.seniorityLevel,
        workArrangement: editForm.workArrangement,
        location: editForm.location,
        salaryRangeMin: editForm.salaryRangeMin ? parseInt(editForm.salaryRangeMin) : null,
        salaryRangeMax: editForm.salaryRangeMax ? parseInt(editForm.salaryRangeMax) : null,
        keySellingPoints: editForm.keySellingPoints,
        candidatesRequested: parseInt(editForm.candidatesRequested)
      };
      
      await updateJob(editingJobId, updates);
      setEditingJobId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Error updating job. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingJobId(null);
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
      
      {/* Job List */}
      <Card>
        <CardContent className="p-8">
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
                    const isEditing = editingJobId === job.id;
                    
                    return (
                      <tr key={job.id} className="hover:bg-shadowforce transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => handleFormChange('title', e.target.value)}
                                placeholder="Job Title"
                                className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                              />
                              <textarea
                                value={editForm.description}
                                onChange={(e) => handleFormChange('description', e.target.value)}
                                placeholder="Job Description"
                                rows={3}
                                className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-jakarta font-bold text-white-knight">{job.title}</div>
                              <div className="text-sm text-guardian">{job.seniorityLevel} • {job.workArrangement}</div>
                            </div>
                          )}
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
                            {job.sourcerName || 'Unassigned'}
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
                            {isEditing ? (
                              <>
                                <Button
                                  onClick={handleSaveJob}
                                  variant="outline"
                                  size="sm"
                                  className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                                >
                                  <Save size={16} />
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                                >
                                  <X size={16} />
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={() => handleEditJob(job)}
                                variant="outline"
                                size="sm"
                                className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                              >
                                <Edit size={16} />
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDeleteJob(job.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                            >
                              <Trash2 size={16} />
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
    </div>
  );
};