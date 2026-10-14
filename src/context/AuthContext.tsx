import React, { createContext, useContext, useState } from 'react';
import { UserProfile, UserRole } from '../types/audit';
import { DEMO_USERS } from '../lib/mockData';
import { StorageService } from '../lib/storage';

interface AuthContextType {
  currentUser: UserProfile;
  switchUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  availableUsers: UserProfile[];
  canManageInventory: boolean;
  canApproveRequests: boolean;
  canSubmitHospitalRequest: boolean;
  canManageDonors: boolean;
  canViewAuditLogs: boolean;
  canConfigureSettings: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<UserProfile>(() => StorageService.getCurrentUser());

  const switchUser = (user: UserProfile) => {
    setCurrentUserState(user);
    StorageService.setCurrentUser(user);
  };

  const switchRole = (role: UserRole) => {
    const matched = DEMO_USERS.find(u => u.role === role) || {
      id: `user_${role}`,
      name: `${role.toUpperCase()} User`,
      email: `${role}@bloodbridge.org`,
      role,
      title: `${role.replace(/_/g, ' ')}`,
      organization: 'BloodBridge Health Network'
    };
    switchUser(matched);
  };

  const canManageInventory = currentUser.role === 'administrator' || currentUser.role === 'blood_bank_staff';
  const canApproveRequests = currentUser.role === 'administrator' || currentUser.role === 'blood_bank_staff';
  const canSubmitHospitalRequest = currentUser.role === 'administrator' || currentUser.role === 'hospital_staff';
  const canManageDonors = currentUser.role === 'administrator' || currentUser.role === 'blood_bank_staff';
  const canViewAuditLogs = currentUser.role === 'administrator' || currentUser.role === 'blood_bank_staff';
  const canConfigureSettings = currentUser.role === 'administrator';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchUser,
        switchRole,
        availableUsers: DEMO_USERS,
        canManageInventory,
        canApproveRequests,
        canSubmitHospitalRequest,
        canManageDonors,
        canViewAuditLogs,
        canConfigureSettings
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
