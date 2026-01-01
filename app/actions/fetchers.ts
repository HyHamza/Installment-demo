'use server';

import { getCustomers } from '@/db/actions';

export async function fetchCustomers(profileId: string) {
    // Simple wrapper to get customers for a profile
    return await getCustomers(profileId);
}
