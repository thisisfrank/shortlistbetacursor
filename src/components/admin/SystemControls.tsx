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
    candidates, 
    resetData, 
    deleteJob, 
    updateJob 
  } = useData();
  
  const [isExporting, setIsExporting] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  // System statistics
  const systemStats = {
    totalJobs: jobs.length,
    totalCandidates: candidates.length,
    unclaimedJobs: jobs.filter(job => job.status === 'Unclaimed').length,
    claimedJobs: jobs.filter(job => job.status === 'Claimed').length,
    completedJobs: jobs.filter(job => job.status === 'Completed').length,
    dataSize: Math.round((JSON.stringify({ jobs, candidates }).length / 1024) * 100) / 100
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = {
        jobs,
        candidates,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        console.log('Imported data:', data);
        // Note: In a real implementation, you'd want to validate and process this data
        alert('Import functionality would be implemented here.');
      } catch (error) {
        console.error('Import failed:', error);
        alert('Invalid import file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleBulkDelete = () => {
    if (window.confirm('Are you sure you want to delete ALL jobs and candidates? This action cannot be undone.')) {
      // In a real implementation, you'd want to delete from the database
      alert('Bulk delete functionality would be implemented here.');
    }
  };

  const handleResetSystem = () => {
    if (window.confirm('Are you sure you want to reset the entire system? This will clear ALL data and cannot be undone.')) {
      resetData();
    }
  };

  return (
    <div className="space-y-8">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <h3 className="text-2xl font-anton text-white-knight uppercase tracking-wide">System Overview</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Briefcase className="text-blue-400" size={24} />
              </div>
              <p className="text-2xl font-anton text-white-knight">{systemStats.totalJobs}</p>
              <p className="text-sm text-guardian">Total Jobs</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="text-green-400" size={24} />
              </div>
              <p className="text-2xl font-anton text-white-knight">{systemStats.totalCandidates}</p>
              <p className="text-sm text-guardian">Candidates</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="text-purple-400" size={24} />
              </div>
              <p className="text-2xl font-anton text-white-knight">{systemStats.dataSize}KB</p>
              <p className="text-sm text-guardian">Data Size</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="text-green-400" size={24} />
              </div>
              <p className="text-2xl font-anton text-white-knight">{systemStats.completedJobs}</p>
              <p className="text-sm text-guardian">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <h3 className="text-2xl font-anton text-white-knight uppercase tracking-wide">Data Management</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-anton text-white-knight">Export & Import</h4>
              <div className="space-y-3">
                <Button 
                  onClick={handleExportData} 
                  disabled={isExporting}
                  className="w-full"
                >
                  <Download size={16} className="mr-2" />
                  {isExporting ? 'Exporting...' : 'Export All Data'}
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="w-full">
                    <Upload size={16} className="mr-2" />
                    Import Data
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-anton text-white-knight">System Actions</h4>
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowDangerZone(!showDangerZone)}
                  variant="outline"
                  className="w-full"
                >
                  <Settings size={16} className="mr-2" />
                  Advanced Controls
                </Button>
                <Button 
                  onClick={handleBulkDelete}
                  variant="outline"
                  className="w-full text-red-400 border-red-400/30 hover:bg-red-400/10"
                >
                  <Trash2 size={16} className="mr-2" />
                  Bulk Delete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {showDangerZone && (
        <Card className="border-red-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-400" size={24} />
              <h3 className="text-2xl font-anton text-red-400 uppercase tracking-wide">Danger Zone</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-lg font-anton text-red-400 mb-2">System Reset</h4>
                <p className="text-guardian mb-4">
                  This will permanently delete all jobs, candidates, and system data. 
                  This action cannot be undone.
                </p>
                <Button 
                  onClick={handleResetSystem}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Reset Entire System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};