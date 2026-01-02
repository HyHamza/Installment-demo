'use client';

import { supabase } from '@/lib/supabase';
import { localDB, isClient } from '@/lib/local-db';
import { 
  getUnsyncedRecords, 
  markRecordsSynced,
  getLocalProfiles,
  getLocalCustomers,
  getLocalInstallments,
  getLocalProjects
} from '@/db/local-actions';
import { 
  getProfiles, 
  getCustomers, 
  getInstallments,
  addCustomer as addSupabaseCustomer,
  addInstallment as addSupabaseInstallment
} from '@/db/actions';

export class SyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress: boolean = false;

  constructor() {
    if (isClient()) {
      // Listen for online/offline events
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.autoSync();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  async isSupabaseOnline(): Promise<boolean> {
    if (!this.isOnline || !supabase) return false;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  async autoSync() {
    if (this.syncInProgress || !this.isOnline) return;
    
    try {
      this.syncInProgress = true;
      await this.performFullSync();
    } catch (error) {
      console.error('Auto sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async performFullSync(profileId?: string): Promise<{ success: boolean; message: string }> {
    if (!isClient()) {
      return { success: false, message: 'Sync only available in browser' };
    }

    if (this.syncInProgress) {
      return { success: false, message: 'Sync already in progress' };
    }

    const isOnline = await this.isSupabaseOnline();
    if (!isOnline) {
      return { success: false, message: 'Cannot connect to server - working offline' };
    }

    try {
      this.syncInProgress = true;

      // Step 1: Push local changes to Supabase
      await this.pushLocalChanges();

      // Step 2: Pull latest data from Supabase
      if (profileId) {
        await this.pullSupabaseData(profileId);
      } else {
        // Sync all profiles
        const profiles = await getLocalProfiles();
        for (const profile of profiles) {
          await this.pullSupabaseData(profile.id);
        }
      }

      return { success: true, message: 'Sync completed successfully' };
    } catch (error) {
      console.error('Full sync failed:', error);
      return { success: false, message: `Sync failed: ${(error as Error).message}` };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async pushLocalChanges() {
    const unsyncedRecords = await getUnsyncedRecords();
    const syncedRecordIds: number[] = [];

    for (const record of unsyncedRecords) {
      try {
        switch (record.table_name) {
          case 'profiles':
            await this.syncProfile(record);
            break;
          case 'customers':
            await this.syncCustomer(record);
            break;
          case 'installments':
            await this.syncInstallment(record);
            break;
          case 'projects':
            await this.syncProject(record);
            break;
        }
        
        if (record.id) {
          syncedRecordIds.push(record.id);
        }
      } catch (error) {
        console.error(`Failed to sync ${record.table_name} record ${record.record_id}:`, error);
        // Continue with other records
      }
    }

    // Mark successfully synced records
    if (syncedRecordIds.length > 0) {
      await markRecordsSynced(syncedRecordIds);
    }
  }

  private async syncProfile(record: any) {
    const localProfile = await localDB.profiles.get(record.record_id);
    if (!localProfile || !supabase) return;

    switch (record.action) {
      case 'create':
        await supabase.from('profiles').insert({
          id: localProfile.id,
          name: localProfile.name,
          created_at: localProfile.created_at
        });
        break;
      case 'update':
        await supabase.from('profiles').update({
          name: localProfile.name
        }).eq('id', localProfile.id);
        break;
      case 'delete':
        await supabase.from('profiles').delete().eq('id', localProfile.id);
        break;
    }

    // Mark as synced in local DB
    await localDB.profiles.update(localProfile.id, { synced: true });
  }

  private async syncCustomer(record: any) {
    const localCustomer = await localDB.customers.get(record.record_id);
    if (!localCustomer || !supabase) return;

    switch (record.action) {
      case 'create':
        await supabase.from('customers').insert({
          id: localCustomer.id,
          profile_id: localCustomer.profile_id,
          name: localCustomer.name,
          phone: localCustomer.phone,
          total_amount: localCustomer.total_amount,
          installment_amount: localCustomer.installment_amount,
          photo_url: localCustomer.photo_url,
          document_url: localCustomer.document_url,
          is_active: localCustomer.is_active,
          created_at: localCustomer.created_at
        });
        break;
      case 'update':
        await supabase.from('customers').update({
          name: localCustomer.name,
          phone: localCustomer.phone,
          total_amount: localCustomer.total_amount,
          installment_amount: localCustomer.installment_amount,
          photo_url: localCustomer.photo_url,
          document_url: localCustomer.document_url,
          is_active: localCustomer.is_active
        }).eq('id', localCustomer.id);
        break;
      case 'delete':
        await supabase.from('customers').delete().eq('id', localCustomer.id);
        break;
    }

    // Mark as synced in local DB
    await localDB.customers.update(localCustomer.id, { synced: true });
  }

  private async syncInstallment(record: any) {
    const localInstallment = await localDB.installments.get(record.record_id);
    if (!localInstallment || !supabase) return;

    switch (record.action) {
      case 'create':
        await supabase.from('installments').insert({
          id: localInstallment.id,
          customer_id: localInstallment.customer_id,
          amount: localInstallment.amount,
          date: localInstallment.date,
          created_at: localInstallment.created_at
        });
        break;
      case 'update':
        await supabase.from('installments').update({
          amount: localInstallment.amount,
          date: localInstallment.date
        }).eq('id', localInstallment.id);
        break;
      case 'delete':
        await supabase.from('installments').delete().eq('id', localInstallment.id);
        break;
    }

    // Mark as synced in local DB
    await localDB.installments.update(localInstallment.id, { synced: true });
  }

  private async syncProject(record: any) {
    const localProject = await localDB.projects.get(record.record_id);
    if (!localProject || !supabase) return;

    // Note: Projects table doesn't exist in Supabase yet - will be added in Phase 3
    console.log('Project sync will be implemented when projects table is added to Supabase');
  }

  private async pullSupabaseData(profileId: string) {
    if (!supabase) return;

    try {
      // Pull profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      if (profiles) {
        for (const profile of profiles) {
          await localDB.profiles.put({
            ...profile,
            synced: true,
            last_sync: new Date().toISOString()
          });
        }
      }

      // Pull customers for this profile
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .eq('profile_id', profileId);

      if (customers) {
        for (const customer of customers) {
          await localDB.customers.put({
            ...customer,
            synced: true,
            last_modified: customer.created_at
          });
        }
      }

      // Pull installments for customers of this profile
      if (customers) {
        const customerIds = customers.map(c => c.id);
        const { data: installments } = await supabase
          .from('installments')
          .select('*')
          .in('customer_id', customerIds);

        if (installments) {
          for (const installment of installments) {
            await localDB.installments.put({
              ...installment,
              synced: true,
              last_modified: installment.created_at
            });
          }
        }
      }
    } catch (error) {
      console.error('Error pulling data from Supabase:', error);
      throw error;
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}

// Global sync manager instance
export const syncManager = new SyncManager();