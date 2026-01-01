'use server';

import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  name: string;
  created_at?: string;
};

export type Customer = {
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
  // These get calculated on the fly
  paid_amount?: number;
  remaining_amount?: number;
};

export type Installment = {
  id: string;
  customer_id: string;
  amount: number;
  date: string;
  created_at: string;
  synced: boolean;
};

// Get all profiles (like different shops or users)
export async function getProfiles(): Promise<Profile[]> {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Couldn\'t fetch profiles:', error);
    throw error;
  }

  return data || [];
}

// Create a new profile
export async function createProfile(name: string) {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({ name })
    .select()
    .single();

  if (error) {
    console.error('Failed to create profile:', error);
    throw error;
  }

  return data.id;
}

// Get all customers for a specific profile
export async function getCustomers(profileId: string): Promise<Customer[]> {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Couldn\'t get customers:', error);
    throw error;
  }

  // Now let's figure out how much each customer has paid
  const customersWithPaidAmounts = await Promise.all(
    (customers || []).map(async (customer) => {
      const { data: installments, error: installmentError } = await supabase
        .from('installments')
        .select('amount')
        .eq('customer_id', customer.id);

      if (installmentError) {
        console.error('Problem getting installments:', installmentError);
        customer.paid_amount = 0;
      } else {
        customer.paid_amount = installments?.reduce((sum, inst) => sum + Number(inst.amount), 0) || 0;
      }

      customer.remaining_amount = customer.total_amount - customer.paid_amount;
      return customer;
    })
  );

  return customersWithPaidAmounts;
}

// Get one specific customer
export async function getCustomer(id: string): Promise<Customer | undefined> {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Couldn\'t find that customer:', error);
    return undefined;
  }

  if (customer) {
    // Let's calculate how much they've paid so far
    const { data: installments, error: installmentError } = await supabase
      .from('installments')
      .select('amount')
      .eq('customer_id', customer.id);

    if (installmentError) {
      console.error('Problem getting payment history:', installmentError);
      customer.paid_amount = 0;
    } else {
      customer.paid_amount = installments?.reduce((sum, inst) => sum + Number(inst.amount), 0) || 0;
    }

    customer.remaining_amount = customer.total_amount - customer.paid_amount;
  }

  return customer;
}

// Add a new customer
export async function addCustomer(data: Omit<Customer, 'id' | 'created_at' | 'synced' | 'paid_amount' | 'remaining_amount'>) {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      profile_id: data.profile_id,
      name: data.name,
      phone: data.phone,
      total_amount: data.total_amount,
      installment_amount: data.installment_amount,
      photo_url: data.photo_url,
      document_url: data.document_url,
      is_active: data.is_active
    })
    .select()
    .single();

  if (error) {
    console.error('Couldn\'t add the customer:', error);
    throw error;
  }

  return customer.id;
}

// Get all payments for a customer
export async function getInstallments(customerId: string): Promise<Installment[]> {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data, error } = await supabase
    .from('installments')
    .select('*')
    .eq('customer_id', customerId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Couldn\'t get payment history:', error);
    throw error;
  }

  return data || [];
}

// Record a new payment
export async function addInstallment(customerId: string, amount: number, date: string) {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data, error } = await supabase
    .from('installments')
    .insert({
      customer_id: customerId,
      amount,
      date
    })
    .select()
    .single();

  if (error) {
    console.error('Couldn\'t record the payment:', error);
    throw error;
  }

  return data.id;
}

// Get all payments for a specific day
export async function getDailyInstallments(profileId: string, date: string): Promise<Installment[]> {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data, error } = await supabase
    .from('installments')
    .select(`
      *,
      customers!inner(profile_id)
    `)
    .eq('customers.profile_id', profileId)
    .eq('date', date);

  if (error) {
    console.error('Couldn\'t get today\'s payments:', error);
    throw error;
  }

  return data || [];
}

// Get the big picture numbers for the dashboard
export async function getDashboardStats(profileId: string) {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  // First, let's see how much money we've collected
  const { data: installmentData, error: installmentError } = await supabase
    .from('installments')
    .select(`
      amount,
      customers!inner(profile_id)
    `)
    .eq('customers.profile_id', profileId);

  if (installmentError) {
    console.error('Problem getting collection stats:', installmentError);
    throw installmentError;
  }

  const totalCollected = installmentData?.reduce((sum, inst) => sum + Number(inst.amount), 0) || 0;

  // Now let's see how much we're expecting in total
  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .select('total_amount')
    .eq('profile_id', profileId);

  if (customerError) {
    console.error('Problem getting customer totals:', customerError);
    throw customerError;
  }

  const totalExpected = customerData?.reduce((sum, customer) => sum + Number(customer.total_amount), 0) || 0;
  const pendingAmount = totalExpected - totalCollected;

  return {
    totalCollected,
    pendingAmount,
    totalExpected
  };
}