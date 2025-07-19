import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FormInput } from '../forms/FormInput';
import { Users, Trash2, Edit, X, Save, Crown, CreditCard, Plus, Mail, User } from 'lucide-react';

export const ClientManagement: React.FC = () => {
  const { userProfiles, jobs, deleteClient } = useData();
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  
  // Defensive programming: ensure arrays are defined
  const safeUsers = userProfiles || [];
  const safeJobs = jobs || [];
  
  // Filter to only show client users
  const clientUsers = safeUsers.filter(user => user.role === 'client');
  
  // Debug: Log client data
  console.log('🔍 ClientManagement Debug:', {
    totalUsers: safeUsers.length,
    clientUsers: clientUsers.length,
    totalJobs: safeJobs.length
  });

  const [editForm, setEditForm] = useState<any>({});

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this user and all associated jobs? This action cannot be undone.')) {
      deleteClient(clientId);
    }
  };

  const handleEditClient = (client: any) => {
    setEditingClientId(client.id);
    setEditForm({
      email: client.email,
      role: client.role
    });
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = () => {
    if (editingClientId) {
      // For now, we'll just close edit mode since updateClient functionality
      // would need to be implemented for UserProfile updates
      setEditingClientId(null);
      setEditForm({});
      // TODO: Implement user profile updates if needed
      alert('User profile updates not yet implemented');
    }
  };

  const handleCancelEdit = () => {
    setEditingClientId(null);
    setEditForm({});
  };

  return (
    <>
      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-anton text-white-knight mb-8 uppercase tracking-wide">Client Users</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-guardian/20">
              <thead className="bg-shadowforce">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    User Details
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Jobs Posted
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
                {clientUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-guardian font-jakarta">
                      No client users found.
                    </td>
                  </tr>
                ) : (
                  clientUsers.map(user => {
                    const userJobs = safeJobs.filter(job => job.userId === user.id);
                    const isEditing = editingClientId === user.id;
                    
                    return (
                      <tr key={user.id} className="hover:bg-shadowforce transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="text-blue-400 mr-3" size={24} />
                            <div>
                              <div className="text-sm font-jakarta font-bold text-white-knight">
                                User ID: {user.id.slice(0, 8)}...
                              </div>
                              <div className="text-sm text-guardian">
                                Client Account
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => handleFormChange('email', e.target.value)}
                              className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                            />
                          ) : (
                            <div className="flex items-center">
                              <Mail className="text-guardian mr-2" size={14} />
                              <span className="text-sm text-white-knight font-jakarta">{user.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={editForm.role}
                              onChange={(e) => handleFormChange('role', e.target.value)}
                              className="text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                            >
                              <option value="client">Client</option>
                              <option value="sourcer">Sourcer</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <Badge variant={user.role === 'client' ? 'success' : 'outline'}>
                              {user.role.toUpperCase()}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          <div className="flex items-center">
                            <Users size={14} className="mr-2" />
                            {userJobs.length} jobs
                          </div>
                          <div className="text-xs text-guardian/60">
                            Active: {userJobs.filter(job => job.status !== 'Completed').length}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="success">
                            Active
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {isEditing ? (
                            <>
                              <Button 
                                variant="success" 
                                size="sm"
                                onClick={handleSaveEdit}
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
                                onClick={() => handleEditClient(user)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button 
                                variant="error" 
                                size="sm"
                                onClick={() => handleDeleteClient(user.id)}
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
        </CardContent>
      </Card>
    </>
  );
};