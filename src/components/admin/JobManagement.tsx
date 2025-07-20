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
      companyName: job.companyName,
      location: job.location,
      seniorityLevel: job.seniorityLevel,
      workArrangement: job.workArrangement,
      salaryRangeMin: job.salaryRangeMin,
      salaryRangeMax: job.salaryRangeMax
    });
  };

  const handleSaveEdit = async () => {
    if (!editingJobId) return;
    
    try {
      await updateJob(editingJobId, editForm);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-anton text-white-knight uppercase tracking-wide">Job Management</h2>
          <p className="text-guardian font-jakarta mt-2">Manage and edit job requests</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-guardian" />
            </div>
            <input
              type="text"
              placeholder="Search jobs..."
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
      <div className="grid gap-6">
        {sortedJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-guardian font-jakarta">No jobs found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          sortedJobs.map(job => (
            <Card key={job.id} className="hover:border-supernova/50 transition-colors">
              <CardContent className="p-6">
                {editingJobId === job.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Job Title"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      />
                      <FormInput
                        label="Company Name"
                        value={editForm.companyName || ''}
                        onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
                      />
                      <FormInput
                        label="Location"
                        value={editForm.location || ''}
                        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      />
                      <FormSelect
                        label="Seniority Level"
                        value={editForm.seniorityLevel || ''}
                        onChange={(e) => setEditForm({...editForm, seniorityLevel: e.target.value})}
                        options={[
                          { value: 'Junior', label: 'Junior' },
                          { value: 'Mid', label: 'Mid' },
                          { value: 'Senior', label: 'Senior' },
                          { value: 'Executive', label: 'Executive' }
                        ]}
                      />
                      <FormSelect
                        label="Work Arrangement"
                        value={editForm.workArrangement || ''}
                        onChange={(e) => setEditForm({...editForm, workArrangement: e.target.value})}
                        options={[
                          { value: 'Remote', label: 'Remote' },
                          { value: 'On-site', label: 'On-site' },
                          { value: 'Hybrid', label: 'Hybrid' }
                        ]}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <FormInput
                          label="Min Salary"
                          type="number"
                          value={editForm.salaryRangeMin || ''}
                          onChange={(e) => setEditForm({...editForm, salaryRangeMin: parseInt(e.target.value)})}
                        />
                        <FormInput
                          label="Max Salary"
                          type="number"
                          value={editForm.salaryRangeMax || ''}
                          onChange={(e) => setEditForm({...editForm, salaryRangeMax: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                    <FormTextarea
                      label="Description"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      rows={4}
                    />
                    <div className="flex items-center justify-end space-x-2">
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        <X size={16} className="mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit} size="sm">
                        <Save size={16} className="mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-anton text-white-knight">{job.title}</h3>
                          <Badge 
                            variant={job.status === 'Completed' ? 'success' : job.status === 'Claimed' ? 'warning' : 'default'}
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <div className="text-guardian font-jakarta space-y-1">
                          <p><strong>Company:</strong> {job.companyName}</p>
                          <p><strong>Location:</strong> {job.location}</p>
                          <p><strong>Level:</strong> {job.seniorityLevel} • {job.workArrangement}</p>
                          <p><strong>Salary:</strong> ${job.salaryRangeMin?.toLocaleString()} - ${job.salaryRangeMax?.toLocaleString()}</p>
                          {job.sourcerName && <p><strong>Sourcer:</strong> {job.sourcerName}</p>}
                          <p><strong>Created:</strong> {formatDate(job.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => setSelectedJobId(job.id)}
                          variant="outline"
                          size="sm"
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={() => handleEditJob(job)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          onClick={() => handleDeleteJob(job.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-guardian">
                      <p className="line-clamp-3">{job.description}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
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