'use client';

import { localDB, LocalProfile, LocalCustomer, LocalInstallment, LocalProject, isClient } from '@/lib/local-db';
import { v4 as uuidv4 } from 'uuid';

// Helper function to add sync metadata
async function addSyncMetadata(tableName: string, recordId: string, action: 'create' | 'update' | 'delete') {
  if (!isClient()) return;
  
  await localDB.sync_metadata.add({
    table_name: tableName,
    record_id: recordId,
    action,
    timestamp: new Date().toISOString(),
    synced: 0 // 0 = false
  });
}

// Profile operations
export async function getLocalProfiles(): Promise<LocalProfile[]> {
  if (!isClient()) return [];
  
  try {
    return await localDB.profiles.orderBy('created_at').toArray();
  } catch (error) {
    console.error('Error fetching local profiles:', error);
    return [];
  }
}

export async function addLocalProfile(name: string): Promise<string> {
  if (!isClient()) throw new Error('Not running in browser');
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const profile: LocalProfile = {
    id,
    name,
    created_at: now,
    synced: false,
    last_sync: null
  };
  
  await localDB.profiles.add(profile);
  await addSyncMetadata('profiles', id, 'create');
  
  return id;
}

// Customer operations
export async function getLocalCustomers(profileId: string): Promise<LocalCustomer[]> {
  if (!isClient()) return [];
  
  try {
    const customers = await localDB.customers
      .where('profile_id')
      .equals(profileId)
      .and(customer => customer.is_active)
      .toArray();

    // Calculate paid amounts for each customer
    const customersWithAmounts = await Promise.all(
      customers.map(async (customer) => {
        const installments = await localDB.installments
          .where('customer_id')
          .equals(customer.id)
          .toArray();
        
        const paidAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
        
        return {
          ...customer,
          paid_amount: paidAmount,
          remaining_amount: customer.total_amount - paidAmount
        };
      })
    );

    return customersWithAmounts;
  } catch (error) {
    console.error('Error fetching local customers:', error);
    return [];
  }
}

export async function getLocalCustomer(id: string): Promise<LocalCustomer | undefined> {
  if (!isClient()) return undefined;
  
  try {
    const customer = await localDB.customers.get(id);
    if (!customer) return undefined;

    // Calculate paid amount
    const installments = await localDB.installments
      .where('customer_id')
      .equals(id)
      .toArray();
    
    const paidAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
    
    return {
      ...customer,
      paid_amount: paidAmount,
      remaining_amount: customer.total_amount - paidAmount
    };
  } catch (error) {
    console.error('Error fetching local customer:', error);
    return undefined;
  }
}

export async function addLocalCustomer(data: Omit<LocalCustomer, 'id' | 'created_at' | 'synced' | 'last_modified'>): Promise<string> {
  if (!isClient()) throw new Error('Not running in browser');
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const customer: LocalCustomer = {
    ...data,
    id,
    created_at: now,
    synced: false,
    last_modified: now
  };
  
  await localDB.customers.add(customer);
  await addSyncMetadata('customers', id, 'create');
  
  return id;
}

export async function updateLocalCustomer(id: string, data: Partial<LocalCustomer>): Promise<void> {
  if (!isClient()) throw new Error('Not running in browser');
  
  const now = new Date().toISOString();
  
  await localDB.customers.update(id, {
    ...data,
    synced: false,
    last_modified: now
  });
  
  await addSyncMetadata('customers', id, 'update');
}

// Installment operations
export async function getLocalInstallments(customerId: string): Promise<LocalInstallment[]> {
  if (!isClient()) return [];
  
  try {
    return await localDB.installments
      .where('customer_id')
      .equals(customerId)
      .reverse()
      .sortBy('date');
  } catch (error) {
    console.error('Error fetching local installments:', error);
    return [];
  }
}

export async function addLocalInstallment(data: Omit<LocalInstallment, 'id' | 'created_at' | 'synced' | 'last_modified'>): Promise<string> {
  if (!isClient()) throw new Error('Not running in browser');
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const installment: LocalInstallment = {
    ...data,
    id,
    created_at: now,
    synced: false,
    last_modified: now
  };
  
  await localDB.installments.add(installment);
  await addSyncMetadata('installments', id, 'create');
  
  return id;
}

// Project operations (new feature)
export async function getLocalProjects(profileId: string): Promise<LocalProject[]> {
  if (!isClient()) return [];
  
  try {
    return await localDB.projects
      .where('profile_id')
      .equals(profileId)
      .and(project => project.is_active)
      .reverse()
      .sortBy('created_at');
  } catch (error) {
    console.error('Error fetching local projects:', error);
    return [];
  }
}

export async function getCustomerProjects(customerId: string): Promise<LocalProject[]> {
  if (!isClient()) return [];
  
  try {
    return await localDB.projects
      .where('customer_id')
      .equals(customerId)
      .and(project => project.is_active)
      .reverse()
      .sortBy('created_at');
  } catch (error) {
    console.error('Error fetching customer projects:', error);
    return [];
  }
}

export async function addLocalProject(data: Omit<LocalProject, 'id' | 'created_at' | 'synced' | 'last_modified'>): Promise<string> {
  if (!isClient()) throw new Error('Not running in browser');
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const project: LocalProject = {
    ...data,
    id,
    created_at: now,
    synced: false,
    last_modified: now
  };
  
  await localDB.projects.add(project);
  await addSyncMetadata('projects', id, 'create');
  
  return id;
}

// Dashboard stats (local version)
export async function getLocalDashboardStats(profileId: string) {
  if (!isClient()) {
    return {
      totalCollected: 0,
      totalExpected: 0,
      pendingAmount: 0
    };
  }
  
  try {
    // Get all customers for this profile
    const customers = await localDB.customers
      .where('profile_id')
      .equals(profileId)
      .and(customer => customer.is_active)
      .toArray();
    
    const totalExpected = customers.reduce((sum, customer) => sum + customer.total_amount, 0);
    
    // Get all installments for these customers
    const customerIds = customers.map(c => c.id);
    const allInstallments = await localDB.installments
      .where('customer_id')
      .anyOf(customerIds)
      .toArray();
    
    const totalCollected = allInstallments.reduce((sum, inst) => sum + inst.amount, 0);
    const pendingAmount = totalExpected - totalCollected;
    
    return {
      totalCollected,
      totalExpected,
      pendingAmount
    };
  } catch (error) {
    console.error('Error calculating local dashboard stats:', error);
    return {
      totalCollected: 0,
      totalExpected: 0,
      pendingAmount: 0
    };
  }
}

// Get daily installments (local version)
export async function getLocalDailyInstallments(profileId: string, date: string): Promise<LocalInstallment[]> {
  if (!isClient()) return [];
  
  try {
    // First get all customers for this profile
    const customers = await localDB.customers
      .where('profile_id')
      .equals(profileId)
      .toArray();
    
    const customerIds = customers.map(c => c.id);
    
    // Then get installments for that date
    return await localDB.installments
      .where('customer_id')
      .anyOf(customerIds)
      .and(installment => installment.date === date)
      .toArray();
  } catch (error) {
    console.error('Error fetching local daily installments:', error);
    return [];
  }
}

// Get unsynced records for sync process
export async function getUnsyncedRecords() {
  if (!isClient()) return [];
  
  try {
    return await localDB.sync_metadata
      .where('synced')
      .equals(0) // Use 0 instead of false for IndexedDB
      .sortBy('timestamp');
  } catch (error) {
    console.error('Error fetching unsynced records:', error);
    return [];
  }
}

// Mark records as synced
export async function markRecordsSynced(recordIds: number[]) {
  if (!isClient()) return;
  
  try {
    await localDB.sync_metadata
      .where('id')
      .anyOf(recordIds)
      .modify({ synced: 1 }); // 1 = true
  } catch (error) {
    console.error('Error marking records as synced:', error);
  }
}