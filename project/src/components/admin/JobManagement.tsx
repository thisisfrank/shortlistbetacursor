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
  
  // Get selected job and client
  const selectedJob = selectedJobId ? jobs.find(job => job.id === selectedJobId) || null : null;
  const client = selectedJob ? getClientById(selectedJob.userId) : null;
  
  // Filter jobs based on status and search
  const filteredJobs = jobs.filter(job => {
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
      deleteJob(jobId);
    }
  };

  const handleCompleteJob = (jobId: string) => {
    if (window.confirm('Are you sure you want to mark this job as completed?')) {
      updateJob(jobId, { status: 'Completed' });
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
      salaryRangeMin: job.salaryRangeMin.toString(),
      salaryRangeMax: job.salaryRangeMax.toString(),
      keySellingPoints: job.keySellingPoints.join('\n'),
      candidatesRequested: job.candidatesRequested.toString(),
      status: job.status,
      sourcerName: job.sourcerName || ''
    });
  };

  const handleSaveJob = () => {
    if (!editingJobId) return;
    
    const updates = {
      title: editForm.title,
      description: editForm.description,
      seniorityLevel: editForm.seniorityLevel,
      workArrangement: editForm.workArrangement,
      location: editForm.location,
      salaryRangeMin: parseInt(editForm.salaryRangeMin),
      salaryRangeMax: parseInt(editForm.salaryRangeMax),
      keySellingPoints: editForm.keySellingPoints.split('\n').filter((point: string) => point.trim()),
      candidatesRequested: parseInt(editForm.candidatesRequested),
      status: editForm.status,
      sourcerName: editForm.sourcerName || null
    };
    
    updateJob(editingJobId, updates);
    setEditingJobId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingJobId(null);
    setEditForm({});
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const seniorityOptions = [
    { value: 'Junior', label: 'Junior' },
    { value: 'Mid', label: 'Mid' },
    { value: 'Senior', label: 'Senior' },
    { value: 'Executive', label: 'Executive' }
  ];

  const workArrangementOptions = [
    { value: 'Remote', label: 'Remote' },
    { value: 'On-site', label: 'On-site' },
    { value: 'Hybrid', label: 'Hybrid' }
  ];

  const statusOptions = [
    { value: 'Unclaimed', label: 'Unclaimed' },
    { value: 'Claimed', label: 'Claimed' },
    { value: 'Completed', label: 'Completed' }
  ];

  return (
    <>
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
                                className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                              />
                              <select
                                value={editForm.seniorityLevel}
                                onChange={(e) => handleFormChange('seniorityLevel', e.target.value)}
                                className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                              >
                                {seniorityOptions.map(option => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                              <select
                                value={editForm.workArrangement}
                                onChange={(e) => handleFormChange('workArrangement', e.target.value)}
                                className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                              >
                                {workArrangementOptions.map(option => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-jakarta font-bold text-white-knight">{job.title}</div>
                              <div className="text-sm text-guardian">{job.seniorityLevel} • {job.workArrangement}</div>
                              {job.status === 'Unclaimed' && (
                                <div className="mt-2">
                                  <JobTimer jobCreatedAt={job.createdAt} size="sm" />
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white-knight font-jakarta font-semibold">{jobClient?.companyName}</div>
                          <div className="text-sm text-guardian">{jobClient?.contactName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={editForm.status}
                              onChange={(e) => handleFormChange('status', e.target.value)}
                              className="text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                            >
                              {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          ) : (
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
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.sourcerName}
                              onChange={(e) => handleFormChange('sourcerName', e.target.value)}
                              placeholder="Sourcer name"
                              className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                            />
                          ) : (
                            job.sourcerName || '—'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          <div className="flex items-center">
                            <CalendarDays size={14} className="mr-2" />
                            {formatDate(job.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {isEditing ? (
                            <>
                              <Button 
                                variant="success" 
                                size="sm"
                                onClick={handleSaveJob}
                              >
                                <Save size={14} />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleCancelEdit}
                              >
                                <X size={14} />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedJobId(job.id)}
                              >
                                VIEW
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditJob(job)}
                              >
                                <Edit size={14} />
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
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Edit Form Modal for Complex Fields */}
          {editingJobId && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-shadowforce-light rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-guardian/20">
                <div className="flex justify-between items-center border-b border-guardian/20 p-6">
                  <h3 className="text-2xl font-anton text-white-knight uppercase tracking-wide">Edit Job Details</h3>
                  <button 
                    onClick={handleCancelEdit}
                    className="text-guardian hover:text-supernova transition-colors"
                  >
                    <X size={28} />
                  </button>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="Location"
                      value={editForm.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                    />
                    <FormInput
                      label="Candidates Requested"
                      type="number"
                      value={editForm.candidatesRequested}
                      onChange={(e) => handleFormChange('candidatesRequested', e.target.value)}
                    />
                    <FormInput
                      label="Min Salary"
                      type="number"
                      value={editForm.salaryRangeMin}
                      onChange={(e) => handleFormChange('salaryRangeMin', e.target.value)}
                    />
                    <FormInput
                      label="Max Salary"
                      type="number"
                      value={editForm.salaryRangeMax}
                      onChange={(e) => handleFormChange('salaryRangeMax', e.target.value)}
                    />
                  </div>
                  
                  <FormTextarea
                    label="Job Description"
                    value={editForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={6}
                  />
                  
                  <FormTextarea
                    label="Key Selling Points (one per line)"
                    value={editForm.keySellingPoints}
                    onChange={(e) => handleFormChange('keySellingPoints', e.target.value)}
                    rows={4}
                  />
                  
                  <div className="flex gap-4 pt-6">
                    <Button onClick={handleSaveJob} className="flex-1">
                      SAVE CHANGES
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                      CANCEL
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedJob && client && (
        <JobDetailModal
          job={selectedJob}
          client={client}
          onClose={() => setSelectedJobId(null)}
        />
      )}
    </>
  );
};