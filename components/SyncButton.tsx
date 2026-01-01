'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { syncData } from '@/app/actions/sync';
import { useProfile } from './ProfileProvider';
import { cn } from '@/lib/utils';

export function SyncButton() {
    const { currentProfile } = useProfile();
    const [syncing, setSyncing] = useState(false);

    const handleSync = async () => {
        if (!currentProfile) return;
        
        setSyncing(true);
        try {
            const res = await syncData(currentProfile.id);
            if (!res.success) {
                if (res.message === 'Supabase isn\'t set up yet') {
                    alert('Sync skipped: Supabase isn\'t configured yet.');
                } else {
                    console.error(res.message);
                }
            } else {
                // Since we're using Supabase now, everything is already synced
                alert('All good! Your data is already synced.');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={syncing}
            className={cn(
                "rounded-full p-2 hover:bg-gray-100 text-gray-500 transition-all",
                syncing && "animate-spin text-blue-500 bg-blue-50"
            )}
            title="Sync Data"
        >
            <RefreshCw className="h-5 w-5" />
        </button>
    );
}
