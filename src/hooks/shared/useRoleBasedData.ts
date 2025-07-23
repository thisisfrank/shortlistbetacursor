import { useAuth } from '../useAuth';
import { useAdminData } from '../admin/useAdminData';
import { useClientData } from '../client/useClientData';
import { useSourcerData } from '../sourcer/useSourcerData';

/**
 * Hook that returns role-appropriate data access
 * This provides a unified interface while maintaining role-based permissions
 */
export const useRoleBasedData = () => {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return null;
  }

  switch (userProfile.role) {
    case 'admin':
      return {
        role: 'admin' as const,
        data: useAdminData(),
      };
    
    case 'client':
      return {
        role: 'client' as const,
        data: useClientData(),
      };
    
    case 'sourcer':
      return {
        role: 'sourcer' as const,
        data: useSourcerData(),
      };
    
    default:
      throw new Error(`Unknown role: ${userProfile.role}`);
  }
};

/**
 * Type-safe hook for admin data access
 */
export const useAdminDataSafe = () => {
  const roleData = useRoleBasedData();
  
  if (!roleData || roleData.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return roleData.data;
};

/**
 * Type-safe hook for client data access
 */
export const useClientDataSafe = () => {
  const roleData = useRoleBasedData();
  
  if (!roleData || roleData.role !== 'client') {
    throw new Error('Client access required');
  }
  
  return roleData.data;
};

/**
 * Type-safe hook for sourcer data access
 */
export const useSourcerDataSafe = () => {
  const roleData = useRoleBasedData();
  
  if (!roleData || roleData.role !== 'sourcer') {
    throw new Error('Sourcer access required');
  }
  
  return roleData.data;
};