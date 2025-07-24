import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FormInput } from '../forms/FormInput';
import { 
  Users, 
  Crown, 
  UserCheck, 
  UserX, 
  Search, 
  AlertCircle,
  CheckCircle,
  Loader,
  Pencil
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'sourcer' | 'admin';
  created_at: string;
  updated_at: string;
  tierId: string; // Changed to string to match database
}

export const UserManagement: React.FC = () => {
  const { tiers } = useData();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotingEmail, setPromotingEmail] = useState('');
  const [demotingEmail, setDemotingEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingTierUserId, setSavingTierUserId] = useState<string | null>(null);
  const [editingTierUserId, setEditingTierUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 UserManagement: Starting user load process...');
      console.log('🔍 UserManagement: Supabase config check:', {
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      });
      
      // Check if user is authenticated and has admin role
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 UserManagement: Current user:', user?.email, user?.role);
      
      if (!user) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        return;
      }
      
      // Check user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      console.log('🔍 UserManagement: User profile:', userProfile, 'Error:', profileError);
      
      if (profileError) {
        console.error('❌ UserManagement: Error loading user profile:', profileError);
        setMessage({ type: 'error', text: `Failed to load user profile: ${profileError.message}` });
        return;
      }
      
      if (userProfile?.role !== 'admin') {
        setMessage({ type: 'error', text: 'Admin access required' });
        return;
      }
      
      console.log('🔍 UserManagement: Calling get_all_users RPC...');
      const { data, error } = await supabase.rpc('get_all_users');
      
      console.log('🔍 UserManagement: RPC response:', { data, error });
      
      if (error) {
        console.error('❌ UserManagement: Error loading users:', error);
        console.error('❌ UserManagement: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        setMessage({ type: 'error', text: `Failed to load users: ${error.message}` });
        return;
      }
      
      console.log('✅ UserManagement: Successfully loaded users:', data?.length || 0);
      setUsers(data || []);
      
      if (data && data.length === 0) {
        setMessage({ type: 'error', text: 'No users found in the database' });
      }
    } catch (error) {
      console.error('💥 UserManagement: Unexpected error loading users:', error);
      setMessage({ type: 'error', text: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (email: string) => {
    try {
      setPromotingEmail(email);
      const { data, error } = await supabase.rpc('promote_user_to_admin', {
        target_email: email
      });
      
      if (error) {
        console.error('Error promoting user:', error);
        setMessage({ type: 'error', text: `Failed to promote ${email}: ${error.message}` });
        return;
      }
      
      setMessage({ type: 'success', text: `${email} promoted to admin successfully` });
      loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Error promoting user:', error);
      setMessage({ type: 'error', text: `Failed to promote ${email}` });
    } finally {
      setPromotingEmail('');
    }
  };

  const demoteFromAdmin = async (email: string) => {
    try {
      setDemotingEmail(email);
      const { data, error } = await supabase.rpc('demote_admin_to_user', {
        target_email: email
      });
      
      if (error) {
        console.error('Error demoting user:', error);
        setMessage({ type: 'error', text: `Failed to demote ${email}: ${error.message}` });
        return;
      }
      
      setMessage({ type: 'success', text: `${email} demoted to client successfully` });
      loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Error demoting user:', error);
      setMessage({ type: 'error', text: `Failed to demote ${email}` });
    } finally {
      setDemotingEmail('');
    }
  };

  // Add handler for tier change
  const handleTierChange = async (userId: string, newTierId: string) => {
    setSavingTierUserId(userId);
    try {
      // Update in Supabase (assume tier_id column exists)
      const { error } = await supabase
        .from('user_profiles')
        .update({ tier_id: newTierId })
        .eq('id', userId);
      if (error) {
        setMessage({ type: 'error', text: `Failed to update tier: ${error.message}` });
      } else {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, tierId: newTierId } : u));
        setMessage({ type: 'success', text: 'Tier updated successfully.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update tier.' });
    } finally {
      setSavingTierUserId(null);
    }
  };

  const filteredUsers = users
    .filter(user =>
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      // Sort by role: admin first, then sourcer, then client
      const roleOrder = { admin: 0, sourcer: 1, client: 2 };
      const roleComparison = (roleOrder[a.role] || 3) - (roleOrder[b.role] || 3);
      if (roleComparison !== 0) return roleComparison;
      // If roles are the same, sort by email
      return a.email.localeCompare(b.email);
    });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="success" className="flex items-center gap-1"><Crown size={12} /> ADMIN</Badge>;
      case 'sourcer':
        return <Badge variant="warning" className="flex items-center gap-1"><UserCheck size={12} /> SOURCER</Badge>;
      case 'client':
        return <Badge variant="default" className="flex items-center gap-1"><Users size={12} /> CLIENT</Badge>;
      default:
        return <Badge variant="default">{role.toUpperCase()}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Users className="text-supernova" size={24} />
          <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">User Management</h2>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="mr-3 flex-shrink-0" size={20} />
            ) : (
              <AlertCircle className="mr-3 flex-shrink-0" size={20} />
            )}
            <p className="font-jakarta text-sm">{message.text}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessage(null)}
              className="ml-auto text-xs"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Search and Stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-guardian" size={16} />
                <FormInput
                  label="Search"
                  type="text"
                  placeholder="Search users by email, name, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 sr-only"
                />
                <input
                  type="text"
                  placeholder="Search users by email, name, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full border-0 border-b-2 px-0 py-4 text-lg bg-transparent text-white-knight placeholder-guardian/60 font-jakarta focus:ring-0 focus:border-supernova transition-colors duration-200 border-guardian/40 hover:border-guardian/60"
                  aria-label="Search users by email, name, or role..."
                />
              </div>
            </div>
            <Button
              onClick={loadUsers}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <Loader className="animate-spin" size={16} /> : <Users size={16} />}
              {loading ? 'LOADING...' : 'REFRESH'}
            </Button>
            <Button
              onClick={async () => {
                console.log('🧪 Testing get_all_users function...');
                try {
                  const { data, error } = await supabase.rpc('get_all_users');
                  console.log('🧪 Test result:', { data, error });
                  setMessage({ 
                    type: error ? 'error' : 'success', 
                    text: error ? `Function test failed: ${error.message}` : `Function exists! Found ${data?.length || 0} users.`
                  });
                } catch (err) {
                  console.error('🧪 Test error:', err);
                  setMessage({ type: 'error', text: `Test failed: ${err instanceof Error ? err.message : 'Unknown error'}` });
                }
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              🧪 TEST FUNCTION
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-shadowforce rounded-lg p-4 border border-guardian/20">
              <div className="text-center">
                <div className="text-2xl font-anton text-white-knight">{users.length}</div>
                <div className="text-sm text-guardian font-jakarta">Total Users</div>
              </div>
            </div>
            <div className="bg-shadowforce rounded-lg p-4 border border-guardian/20">
              <div className="text-center">
                <div className="text-2xl font-anton text-white-knight">
                  {users.filter(u => u.role === 'admin').length}
                </div>
                <div className="text-sm text-guardian font-jakarta">Admins</div>
              </div>
            </div>
            <div className="bg-shadowforce rounded-lg p-4 border border-guardian/20">
              <div className="text-center">
                <div className="text-2xl font-anton text-white-knight">
                  {users.filter(u => u.role === 'sourcer').length}
                </div>
                <div className="text-sm text-guardian font-jakarta">Sourcers</div>
              </div>
            </div>
            <div className="bg-shadowforce rounded-lg p-4 border border-guardian/20">
              <div className="text-center">
                <div className="text-2xl font-anton text-white-knight">
                  {users.filter(u => u.role === 'client').length}
                </div>
                <div className="text-sm text-guardian font-jakarta">Clients</div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-guardian/20">
            <thead className="bg-shadowforce">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <Loader className="animate-spin mr-2" size={20} />
                      <span className="text-guardian font-jakarta">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-guardian font-jakarta">
                    {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-shadowforce transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-jakarta font-bold text-white-knight">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-jakarta text-white-knight">{user.name || 'No name set'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-guardian font-jakarta">
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}; 