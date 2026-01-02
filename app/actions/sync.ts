'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function syncData(profileId: string) {
    console.log(`Starting sync for profile: ${profileId}`);
    
    if (!supabase) {
        throw new Error('Supabase client not available');
    }

    try {
        // This will be called from client-side to trigger server-side sync
        // The actual sync logic will be handled by the client-side sync functions
        
        // Revalidate all paths to refresh cached data
        revalidatePath('/');
        revalidatePath('/customers');
        revalidatePath('/daily');
        
        return { 
            success: true, 
            message: 'Sync completed successfully',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Sync failed:', error);
        return { 
            success: false, 
            message: 'Sync failed: ' + (error as Error).message 
        };
    }
}

// Server action to get online status and trigger sync
export async function checkOnlineAndSync(profileId: string) {
    if (!supabase) {
        return { 
            online: false, 
            message: 'Supabase not configured' 
        };
    }

    try {
        // Test Supabase connection
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', profileId)
            .limit(1);

        if (error) {
            return { 
                online: false, 
                message: 'Cannot connect to server' 
            };
        }

        // If we're online, trigger sync
        const syncResult = await syncData(profileId);
        
        return {
            online: true,
            syncResult,
            message: 'Connected and synced'
        };
    } catch (error) {
        return { 
            online: false, 
            message: 'Offline mode active' 
        };
    }
}
