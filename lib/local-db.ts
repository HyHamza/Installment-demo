'use client';

import Dexie, { Table } from 'dexie';

// Local database types (mirror of Supabase schema)
export interface LocalProfile {
  id: string;
  name: string;
  created_at: string;
  synced: boolean;
  last_sync: string | null;
}

export interface LocalCustomer {
  id: string;
  profile_id: string;
  name: string;
  phone: string;
  total_amount: number;
  installment_amount: number;
  photo_url: string | null;
  document_url: string | null;
  is_active: boolean;
  created_at: string;
  synced: boolean;
  last_modified: string;
  // Calculated fields
  paid_amount?: number;
  remaining_amount?: number;
}

export interface LocalInstallment {
  id: string;
  customer_id: string;
  amount: number;
  date: string;
  created_at: string;
  synced: boolean;
  last_modified: string;
}

export interface LocalProject {
  id: string;
  customer_id: string;
  profile_id: string;
  name: string;
  description: string | null;
  total_amount: number;
  installment_amount: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  synced: boolean;
  last_modified: string;
}

// Sync metadata for tracking changes
export interface SyncMetadata {
  id?: number;
  table_name: string;
  record_id: string;
  action: 'create' | 'update' | 'delete';
  timestamp: string;
  synced: number; // 0 = false, 1 = true (IndexedDB friendly)
}

class LocalDatabase extends Dexie {
  profiles!: Table<LocalProfile>;
  customers!: Table<LocalCustomer>;
  installments!: Table<LocalInstallment>;
  projects!: Table<LocalProject>;
  sync_metadata!: Table<SyncMetadata>;

  constructor() {
    super('InstallmentAppDB');
    
    this.version(1).stores({
      profiles: 'id, name, synced, last_sync',
      customers: 'id, profile_id, name, phone, synced, last_modified, is_active',
      installments: 'id, customer_id, date, synced, last_modified',
      projects: 'id, customer_id, profile_id, name, synced, last_modified, is_active',
      sync_metadata: '++id, table_name, record_id, timestamp, synced'
    });
  }
}

export const localDB = new LocalDatabase();

// Initialize database
export async function initializeLocalDB() {
  try {
    await localDB.open();
    console.log('Local database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize local database:', error);
    return false;
  }
}

// Check if we're running in browser
export function isClient() {
  return typeof window !== 'undefined';
}