'use server';

import { addCustomer } from '@/db/actions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createCustomerAction(formData: FormData) {
  // Grab all the info from the form
  const profileId = formData.get('profileId') as string;
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const totalAmount = parseFloat(formData.get('totalAmount') as string);
  const installmentAmount = parseFloat(formData.get('installmentAmount') as string);
  const photoUrl = formData.get('photoUrl') as string;
  const documentUrl = formData.get('documentUrl') as string;

  // Make sure we have the important stuff
  if (!profileId || !name || !totalAmount || !installmentAmount) {
    throw new Error('Hey, you\'re missing some important info!');
  }

  // Add the new customer to our database
  await addCustomer({
    profile_id: profileId,
    name,
    phone,
    total_amount: totalAmount,
    installment_amount: installmentAmount,
    photo_url: photoUrl || null,
    document_url: documentUrl || null,
    is_active: true
  });

  // Refresh the pages so they show the new customer
  revalidatePath('/customers');
  revalidatePath('/');
  redirect('/customers');
}
