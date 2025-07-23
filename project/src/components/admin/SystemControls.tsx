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
      
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data. Please try again.');
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
        
        if (window.confirm('Import this data? This will replace all current data.')) {
          // TODO: Implement data import logic
          alert('Data import feature coming soon!');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Invalid file format. Please select a valid export file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="text-supernova" size={24} />
            <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">System Controls</h2>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-shadowforce rounded-lg p-4 border border-guardian/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-anton text-guardian uppercase tracking-wide">Total Jobs</h3>
                  <p className="text-2xl font-anton text-white-knight">{systemStats.totalJobs}</p>
                </div>
                <Briefcase className="text-supernova" size={24} />
              </div>
            </div>
            
            <div className="bg-shadowforce rounded-lg p-4 border border-guardian/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-anton text-guardian uppercase tracking-wide">Candidates</h3>
                  <p className="text-2xl font-anton text-white-knight">{systemStats.totalCandidates}</p>
                </div>
                <Users className="text-supernova" size={24} />
              </div>
            </div>
            
            <div className="bg-shadowforce rounded-lg p-4 border border-guardian/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-anton text-guardian uppercase tracking-wide">Data Size</h3>
                  <p className="text-2xl font-anton text-white-knight">{systemStats.dataSize} KB</p>
                </div>
                <Database className="text-supernova" size={24} />
              </div>
            </div>
            
            <div className="bg-shadowforce rounded-lg p-4 border border-guardian/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-anton text-guardian uppercase tracking-wide">Status</h3>
                  <Badge variant="success" className="text-xs">
                    <CheckCircle size={12} className="mr-1" />
                    Healthy
                  </Badge>
                </div>
                <Settings className="text-supernova" size={24} />
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-shadowforce rounded-lg p-6 border border-guardian/20">
            <h3 className="text-lg font-anton text-white-knight mb-4 uppercase tracking-wide">Data Management</h3>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleExportData}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                {isExporting ? 'EXPORTING...' : 'EXPORT DATA'}
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload size={16} />
                  IMPORT DATA
                </Button>
              </div>
              
              <Button
                onClick={() => {
                  if (window.confirm('Refresh all data from database? This will reload all jobs and candidates.')) {
                    window.location.reload();
                  }
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                REFRESH DATA
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-8">
            <Button
              onClick={() => setShowDangerZone(!showDangerZone)}
              variant="outline"
              className="flex items-center gap-2 text-orange-400 border-orange-400/30 hover:bg-orange-400/10"
            >
              <AlertTriangle size={16} />
              {showDangerZone ? 'HIDE DANGER ZONE' : 'SHOW DANGER ZONE'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {showDangerZone && (
        <Card className="border-orange-500/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-400" size={24} />
              <h3 className="text-xl font-anton text-orange-400 uppercase tracking-wide">Danger Zone</h3>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-lg">
                <h4 className="text-lg font-anton text-red-400 mb-3 uppercase tracking-wide">
                  System Reset
                </h4>
                <p className="text-guardian font-jakarta mb-4">
                  Reset all system data. This action cannot be undone.
                </p>
                <Button
                  variant="error"
                  size="md"
                  onClick={() => {
                    if (window.confirm('Are you absolutely sure you want to reset ALL system data? This will delete all jobs and candidates permanently.')) {
                      if (window.confirm('Final warning: This will delete everything. Type "RESET" to confirm.')) {
                        resetData();
                        alert('System reset complete.');
                      }
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  RESET ALL DATA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};