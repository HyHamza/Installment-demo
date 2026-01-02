'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '@/lib/sync-manager';
import { initializeLocalDB, isClient } from '@/lib/local-db';
import {
  getLocalCustomers,
  getLocalInstallments,
  getLocalDashboardStats,
  getLocalProfiles,
  addLocalCustomer,
  addLocalInstallment,
  getLocalCustomer
} from '@/db/local-actions';
import {
  getCustomers as getSupabaseCustomers,
  getInstallments as getSupabaseInstallments,
  getDashboardStats as getSupabaseDashboardStats,
  getProfiles as getSupabaseProfiles,
  addCustomer as addSupabaseCustomer,
  addInstallment as addSupabaseInstallment,
  getCustomer as getSupabaseCustomer
} from '@/db/actions';

export function useOfflineData() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isClient()) return;

    // Initialize local database
    initializeLocalDB().then(() => {
      setIsInitialized(true);
    });

    // Set up online/offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = useCallback(async (profileId?: string) => {
    if (!isInitialized) return;

    setSyncStatus('syncing');
    try {
      const result = await syncManager.performFullSync(profileId);
      setSyncStatus(result.success ? 'success' : 'error');
      
      // Reset status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
      
      return result;
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
      throw error;
    }
  }, [isInitialized]);

  // Data fetching functions that work offline-first
  const getCustomers = useCallback(async (profileId: string) => {
    if (!isInitialized) return [];

    try {
      if (isOnline && syncManager.getOnlineStatus()) {
        // Try online first, fallback to local
        try {
          const onlineData = await getSupabaseCustomers(profileId);
          return onlineData;
        } catch (error) {
          console.log('Online fetch failed, using local data:', error);
          return await getLocalCustomers(profileId);
        }
      } else {
        // Use local data when offline
        return await getLocalCustomers(profileId);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }, [isOnline, isInitialized]);

  const getCustomer = useCallback(async (id: string) => {
    if (!isInitialized) return undefined;

    try {
      if (isOnline && syncManager.getOnlineStatus()) {
        try {
          const onlineData = await getSupabaseCustomer(id);
          return onlineData;
        } catch (error) {
          console.log('Online fetch failed, using local data:', error);
          return await getLocalCustomer(id);
        }
      } else {
        return await getLocalCustomer(id);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      return undefined;
    }
  }, [isOnline, isInitialized]);

  const getInstallments = useCallback(async (customerId: string) => {
    if (!isInitialized) return [];

    try {
      if (isOnline && syncManager.getOnlineStatus()) {
        try {
          const onlineData = await getSupabaseInstallments(customerId);
          return onlineData;
        } catch (error) {
          console.log('Online fetch failed, using local data:', error);
          return await getLocalInstallments(customerId);
        }
      } else {
        return await getLocalInstallments(customerId);
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
      return [];
    }
  }, [isOnline, isInitialized]);

  const getDashboardStats = useCallback(async (profileId: string) => {
    if (!isInitialized) {
      return { totalCollected: 0, totalExpected: 0, pendingAmount: 0 };
    }

    try {
      if (isOnline && syncManager.getOnlineStatus()) {
        try {
          const onlineData = await getSupabaseDashboardStats(profileId);
          return onlineData;
        } catch (error) {
          console.log('Online fetch failed, using local data:', error);
          return await getLocalDashboardStats(profileId);
        }
      } else {
        return await getLocalDashboardStats(profileId);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { totalCollected: 0, totalExpected: 0, pendingAmount: 0 };
    }
  }, [isOnline, isInitialized]);

  const getProfiles = useCallback(async () => {
    if (!isInitialized) return [];

    try {
      if (isOnline && syncManager.getOnlineStatus()) {
        try {
          const onlineData = await getSupabaseProfiles();
          return onlineData;
        } catch (error) {
          console.log('Online fetch failed, using local data:', error);
          return await getLocalProfiles();
        }
      } else {
        return await getLocalProfiles();
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
  }, [isOnline, isInitialized]);

  // Data mutation functions that work offline-first
  const addCustomer = useCallback(async (data: any) => {
    if (!isInitialized) throw new Error('Database not initialized');

    try {
      if (isOnline && syncManager.getOnlineStatus()) {
        // Try online first
        try {
          const result = await addSupabaseCustomer(data);
          // Also add to local for immediate UI update
          await addLocalCustomer(data);
          return result;
        } catch (error) {
          console.log('Online add failed, saving locally:', error);
          return await addLocalCustomer(data);
        }
      } else {
        // Save locally when offline
        return await addLocalCustomer(data);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  }, [isOnline, isInitialized]);

  const addInstallment = useCallback(async (customerId: string, amount: number, date: string) => {
    if (!isInitialized) throw new Error('Database not initialized');

    const installmentData = { customer_id: customerId, amount, date };

    try {
      if (isOnline && syncManager.getOnlineStatus()) {
        try {
          const result = await addSupabaseInstallment(customerId, amount, date);
          // Also add to local for immediate UI update
          await addLocalInstallment(installmentData);
          return result;
        } catch (error) {
          console.log('Online add failed, saving locally:', error);
          return await addLocalInstallment(installmentData);
        }
      } else {
        return await addLocalInstallment(installmentData);
      }
    } catch (error) {
      console.error('Error adding installment:', error);
      throw error;
    }
  }, [isOnline, isInitialized]);

  return {
    isOnline,
    isInitialized,
    syncStatus,
    triggerSync,
    // Data functions
    getCustomers,
    getCustomer,
    getInstallments,
    getDashboardStats,
    getProfiles,
    addCustomer,
    addInstallment
  };
}