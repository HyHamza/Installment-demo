'use server';

import { addInstallment } from '@/db/actions';
import { revalidatePath } from 'next/cache';

export async function markDailyPayment(customerId: string, amount: number, date: string) {
    // Record the payment in our database
    await addInstallment(customerId, amount, date);
    
    // Update all the pages that show payment info
    revalidatePath('/daily');
    revalidatePath('/customers');
    revalidatePath('/');
}
