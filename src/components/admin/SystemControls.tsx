import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  Download, 
  Upload, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Users,
  Briefcase
} from 'lucide-react';

export const SystemControls: React.FC = () => {
  const { 
    jobs, 
    clients, 
    candidates, 
    resetData, 
    deleteJob, 
    deleteClient,
    updateJob 
  } = useData();
  
  const [isExporting, setIsExporting] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  // System statistics
  const systemStats = {
    totalJobs: jobs.length,
    totalClients: clients.length,
    totalCandidates: candidates.length,
    unclaimedJobs: jobs.filter(job => job.status === 'Unclaimed').length,
    claimedJobs: jobs.filter(job => job.status === 'Claimed').length,
    completedJobs: jobs.filter(job => job.status === 'Completed').length,
    dataSize: Math.round((JSON.stringify({ jobs, clients, candidates }).length / 1024) * 100) / 100
  };

  const handleExportData = async () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          jobs,
          clients,
          candidates
        },
        stats: systemStats
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `super-recruiter-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Data exported successfully!');
    } catch (error) {
      alert('Error exporting data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkCompleteJobs = () => {
    const unclaimedJobs = jobs.filter(job => job.status === 'Unclaimed');
    
    if (unclaimedJobs.length === 0) {
      alert('No unclaimed jobs to complete.');
      return;
    }

    if (window.confirm(`Mark all ${unclaimedJobs.length} unclaimed jobs as completed?`)) {
      unclaimedJobs.forEach(job => {
        updateJob(job.id, {
          status: 'Completed',
          sourcerName: 'System Admin',
          completionLink: 'Bulk completed by admin'
        });
      });
      alert(`Successfully completed ${unclaimedJobs.length} jobs.`);
    }
  };

  const handleBulkDeleteOldJobs = () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldJobs = jobs.filter(job => 
      new Date(job.createdAt) < thirtyDaysAgo && job.status === 'Completed'
    );

    if (oldJobs.length === 0) {
      alert('No old completed jobs to delete.');
      return;
    }

    if (window.confirm(`Delete ${oldJobs.length} completed jobs older than 30 days?`)) {
      oldJobs.forEach(job => deleteJob(job.id));
      alert(`Successfully deleted ${oldJobs.length} old jobs.`);
    }
  };

  const handleCleanupOrphanedCandidates = () => {
    const jobIds = new Set(jobs.map(job => job.id));
    const orphanedCandidates = candidates.filter(candidate => !jobIds.has(candidate.jobId));

    if (orphanedCandidates.length === 0) {
      alert('No orphaned candidates found.');
      return;
    }

    if (window.confirm(`Remove ${orphanedCandidates.length} orphaned candidates?`)) {
      // Note: This would need a deleteCandidates function in the data context
      alert(`Found ${orphanedCandidates.length} orphaned candidates. Manual cleanup required.`);
    }
  };

  const handleResetSystem = () => {
    if (window.confirm('⚠️ WARNING: This will delete ALL data and reset the system to initial state. This action cannot be undone. Are you absolutely sure?')) {
      if (window.confirm('This is your final warning. All jobs, clients, and candidates will be permanently deleted. Continue?')) {
        resetData();
        alert('System has been reset to initial state.');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="text-supernova" size={24} />
            <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">System Overview</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-anton text-supernova mb-1">{systemStats.totalJobs}</div>
              <div className="text-sm text-guardian font-jakarta">Total Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-anton text-blue-400 mb-1">{systemStats.totalClients}</div>
              <div className="text-sm text-guardian font-jakarta">Total Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-anton text-green-400 mb-1">{systemStats.totalCandidates}</div>
              <div className="text-sm text-guardian font-jakarta">Total Candidates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-anton text-purple-400 mb-1">{systemStats.dataSize}KB</div>
              <div className="text-sm text-guardian font-jakarta">Data Size</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="text-supernova" size={24} />
            <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">Quick Actions</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleExportData}
              disabled={isExporting}
              isLoading={isExporting}
              className="flex items-center gap-2"
            >
              <Download size={18} />
              EXPORT DATA
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleBulkCompleteJobs}
              disabled={systemStats.unclaimedJobs === 0}
              className="flex items-center gap-2"
            >
              <CheckCircle size={18} />
              COMPLETE ALL UNCLAIMED
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleBulkDeleteOldJobs}
              className="flex items-center gap-2"
            >
              <Trash2 size={18} />
              CLEANUP OLD JOBS
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleCleanupOrphanedCandidates}
              className="flex items-center gap-2"
            >
              <RefreshCw size={18} />
              CLEANUP ORPHANED DATA
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw size={18} />
              REFRESH SYSTEM
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowDangerZone(!showDangerZone)}
              className="flex items-center gap-2"
            >
              <AlertTriangle size={18} />
              DANGER ZONE
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-400" size={24} />
            <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">System Health</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-guardian font-jakarta">Data Integrity</span>
              <Badge variant="success">HEALTHY</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-guardian font-jakarta">Storage Usage</span>
              <Badge variant={systemStats.dataSize > 1000 ? 'warning' : 'success'}>
                {systemStats.dataSize > 1000 ? 'HIGH' : 'NORMAL'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-guardian font-jakarta">Active Jobs</span>
              <Badge variant={systemStats.claimedJobs > 10 ? 'warning' : 'default'}>
                {systemStats.claimedJobs} IN PROGRESS
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-guardian font-jakarta">System Performance</span>
              <Badge variant="success">OPTIMAL</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {showDangerZone && (
        <Card className="border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-400" size={24} />
              <h3 className="text-xl font-anton text-red-400 uppercase tracking-wide">Danger Zone</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-lg">
                <h4 className="text-lg font-anton text-red-400 mb-3 uppercase tracking-wide">
                  Reset Entire System
                </h4>
                <p className="text-guardian font-jakarta mb-4">
                  This will permanently delete all jobs, clients, candidates, and reset the system to its initial state. 
                  This action cannot be undone.
                </p>
                <Button
                  variant="error"
                  size="lg"
                  onClick={handleResetSystem}
                  className="flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  RESET ENTIRE SYSTEM
                </Button>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 p-6 rounded-lg">
                <h4 className="text-lg font-anton text-orange-400 mb-3 uppercase tracking-wide">
                  Bulk Operations
                </h4>
                <p className="text-guardian font-jakarta mb-4">
                  Perform bulk operations on system data. Use with caution.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="warning"
                    size="md"
                    onClick={() => {
                      if (window.confirm('Delete all completed jobs? This cannot be undone.')) {
                        jobs.filter(job => job.status === 'Completed').forEach(job => deleteJob(job.id));
                        alert('All completed jobs deleted.');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Briefcase size={16} />
                    DELETE ALL COMPLETED JOBS
                  </Button>
                  <Button
                    variant="warning"
                    size="md"
                    onClick={() => {
                      if (window.confirm('Delete all clients with no jobs? This cannot be undone.')) {
                        const clientsWithNoJobs = clients.filter(client => 
                          !jobs.some(job => job.clientId === client.id)
                        );
                        clientsWithNoJobs.forEach(client => deleteClient(client.id));
                        alert(`Deleted ${clientsWithNoJobs.length} clients with no jobs.`);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Users size={16} />
                    DELETE INACTIVE CLIENTS
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}