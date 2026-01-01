'use server';

import { getCustomers, getDailyInstallments } from '@/db/actions';

export async function getDailyData(profileId: string, date: string) {
    // Get all customers and today's payments
    const customers = await getCustomers(profileId);
    const installments = await getDailyInstallments(profileId, date);
    
    return { customers, installments };
}
