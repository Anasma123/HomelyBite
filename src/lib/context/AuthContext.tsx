'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, CookerProfile, DeliveryPersonProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  currentCooker: CookerProfile | null;
  currentRider: DeliveryPersonProfile | null;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  loginUser: (user: User, cooker?: CookerProfile, rider?: DeliveryPersonProfile) => void;
  logout: () => void;
  refreshProfiles: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentCooker, setCurrentCooker] = useState<CookerProfile | null>(null);
  const [currentRider, setCurrentRider] = useState<DeliveryPersonProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('CUSTOMER');
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfiles = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.users) {
        // If no user stored yet, default to Customer Amina
        const storedUserId = localStorage.getItem('hf_active_user_id');
        let activeUser = data.users.find((u: User) => u.id === storedUserId);
        if (!activeUser) {
          activeUser = data.users.find((u: User) => u.role === 'CUSTOMER') || data.users[0];
        }

        if (activeUser) {
          setCurrentUser(activeUser);
          setCurrentRole(activeUser.role);

          if (activeUser.role === 'COOKER') {
            const cRes = await fetch(`/api/cookers`);
            const cData = await cRes.json();
            const foundCooker = cData.cookers?.find((c: CookerProfile) => c.userId === activeUser.id);
            setCurrentCooker(foundCooker || null);
          } else if (activeUser.role === 'RIDER') {
            const rRes = await fetch('/api/delivery/riders');
            const rData = await rRes.json();
            const foundRider = rData.riders?.find((r: DeliveryPersonProfile) => r.userId === activeUser.id);
            setCurrentRider(foundRider || null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load active profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfiles();
  }, []);

  const switchRole = async (targetRole: UserRole) => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.users) {
        const matchingUser = data.users.find((u: User) => u.role === targetRole);
        if (matchingUser) {
          loginUser(matchingUser);
        }
      }
    } catch (err) {
      console.error('Error switching role:', err);
    }
  };

  const loginUser = async (user: User, cooker?: CookerProfile, rider?: DeliveryPersonProfile) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    localStorage.setItem('hf_active_user_id', user.id);

    if (cooker) {
      setCurrentCooker(cooker);
    } else if (user.role === 'COOKER') {
      const cRes = await fetch(`/api/cookers`);
      const cData = await cRes.json();
      const foundCooker = cData.cookers?.find((c: CookerProfile) => c.userId === user.id);
      setCurrentCooker(foundCooker || null);
    } else {
      setCurrentCooker(null);
    }

    if (rider) {
      setCurrentRider(rider);
    } else if (user.role === 'RIDER') {
      const rRes = await fetch('/api/delivery/riders');
      const rData = await rRes.json();
      const foundRider = rData.riders?.find((r: DeliveryPersonProfile) => r.userId === user.id);
      setCurrentRider(foundRider || null);
    } else {
      setCurrentRider(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('hf_active_user_id');
    setCurrentUser(null);
    setCurrentCooker(null);
    setCurrentRider(null);
    setCurrentRole('CUSTOMER');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentCooker,
        currentRider,
        currentRole,
        switchRole,
        loginUser,
        logout,
        refreshProfiles,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
