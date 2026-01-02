'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';
import { syncData } from '@/app/actions/sync';
import { useProfile } from './ProfileProvider';
import { useOfflineData } from '@/hooks/useOfflineData';
import { cn } from '@/lib/utils';

export function SyncButton() {
    const { currentProfile } = useProfile();
    const { isOnline, syncStatus, triggerSync } = useOfflineData();
    const [showStatus, setShowStatus] = useState(false);

    const handleSync = async () => {
        if (!currentProfile) return;
        
        try {
            await triggerSync(currentProfile.id);
            setShowStatus(true);
            setTimeout(() => setShowStatus(false), 3000);
        } catch (error) {
            console.error('Sync failed:', error);
            setShowStatus(true);
            setTimeout(() => setShowStatus(false), 3000);
        }
    };

    const getStatusIcon = () => {
        if (syncStatus === 'syncing') {
            return <RefreshCw className="h-4 w-4 animate-spin" />;
        }
        if (syncStatus === 'success') {
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        }
        if (syncStatus === 'error') {
            return <AlertCircle className="h-4 w-4 text-red-500" />;
        }
        return isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />;
    };

    const getStatusText = () => {
        if (syncStatus === 'syncing') return 'Syncing...';
        if (syncStatus === 'success') return 'Synced';
        if (syncStatus === 'error') return 'Sync failed';
        return isOnline ? 'Online' : 'Offline';
    };

    const getButtonColor = () => {
        if (syncStatus === 'syncing') return 'text-blue-500 bg-blue-50';
        if (syncStatus === 'success') return 'text-green-500 bg-green-50';
        if (syncStatus === 'error') return 'text-red-500 bg-red-50';
        return isOnline ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50';
    };

    return (
        <div className="flex items-center gap-2">
            {/* Status indicator */}
            <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
                getButtonColor()
            )}>
                {getStatusIcon()}
                <span className="hidden sm:inline">{getStatusText()}</span>
            </div>

            {/* Sync button */}
            <button
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
                className={cn(
                    "rounded-full p-2 hover:bg-gray-100 text-gray-500 transition-all",
                    syncStatus === 'syncing' && "animate-pulse text-blue-500 bg-blue-50"
                )}
                title={isOnline ? "Sync with server" : "Sync when online"}
            >
                <RefreshCw className={cn(
                    "h-5 w-5",
                    syncStatus === 'syncing' && "animate-spin"
                )} />
            </button>

            {/* Status message */}
            {showStatus && (
                <div className={cn(
                    "absolute top-full right-0 mt-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium z-50",
                    syncStatus === 'success' && "bg-green-100 text-green-800",
                    syncStatus === 'error' && "bg-red-100 text-red-800",
                    syncStatus === 'syncing' && "bg-blue-100 text-blue-800"
                )}>
                    {syncStatus === 'success' && "Data synced successfully!"}
                    {syncStatus === 'error' && "Sync failed - data saved locally"}
                    {syncStatus === 'syncing' && "Syncing data..."}
                </div>
            )}
        </div>
    );
}
