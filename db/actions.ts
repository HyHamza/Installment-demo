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
      // We already checked supabase above, but TypeScript needs this
      if (!supabase) {
        customer.paid_amount = 0;
        customer.remaining_amount = customer.total_amount;
        return customer;
      }

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

// Project types and functions
export type Project = {
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
  // Calculated fields
  paid_amount?: number;
  remaining_amount?: number;
  progress_percentage?: number;
};

export type Investment = {
  id: string;
  profile_id: string;
  amount: number;
  investment_type: 'capital' | 'loan' | 'profit_reinvestment';
  description: string | null;
  date: string;
  created_at: string;
  synced: boolean;
};

// Get all projects for a profile
export async function getProjects(profileId: string): Promise<Project[]> {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('profile_id', profileId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Couldn\'t get projects:', error);
    throw error;
  }

  // Calculate paid amounts and progress for each project
  const projectsWithProgress = await Promise.all(
    (projects || []).map(async (project) => {
      if (!supabase) {
        project.paid_amount = 0;
        project.remaining_amount = project.total_amount;
        project.progress_percentage = 0;
        return project;
      }

      const { data: installments, error: installmentError } = await supabase
        .from('installments')
        .select('amount')
        .eq('project_id', project.id);

      if (installmentError) {
        console.error('Problem getting project installments:', installmentError);
        project.paid_amount = 0;
      } else {
        project.paid_amount = installments?.reduce((sum, inst) => sum + Number(inst.amount), 0) || 0;
      }

      project.remaining_amount = project.total_amount - project.paid_amount;
      project.progress_percentage = project.total_amount > 0 
        ? Math.round((project.paid_amount / project.total_amount) * 100) 
        : 0;

      return project;
    })
  );

  return projectsWithProgress;
}

// Get projects for a specific customer
export async function getCustomerProjects(customerId: string): Promise<Project[]> {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Couldn\'t get customer projects:', error);
    throw error;
  }

  // Calculate progress for each project
  const projectsWithProgress = await Promise.all(
    (projects || []).map(async (project) => {
      if (!supabase) {
        project.paid_amount = 0;
        project.remaining_amount = project.total_amount;
        project.progress_percentage = 0;
        return project;
      }

      const { data: installments, error: installmentError } = await supabase
        .from('installments')
        .select('amount')
        .eq('project_id', project.id);

      if (installmentError) {
        console.error('Problem getting project installments:', installmentError);
        project.paid_amount = 0;
      } else {
        project.paid_amount = installments?.reduce((sum, inst) => sum + Number(inst.amount), 0) || 0;
      }

      project.remaining_amount = project.total_amount - project.paid_amount;
      project.progress_percentage = project.total_amount > 0 
        ? Math.round((project.paid_amount / project.total_amount) * 100) 
        : 0;

      return project;
    })
  );

  return projectsWithProgress;
}

// Get a single project
export async function getProject(id: string): Promise<Project | undefined> {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Couldn\'t find that project:', error);
    return undefined;
  }

  if (project) {
    if (!supabase) {
      project.paid_amount = 0;
      project.remaining_amount = project.total_amount;
      project.progress_percentage = 0;
      return project;
    }

    // Calculate paid amount and progress
    const { data: installments, error: installmentError } = await supabase
      .from('installments')
      .select('amount')
      .eq('project_id', project.id);

    if (installmentError) {
      console.error('Problem getting project payment history:', installmentError);
      project.paid_amount = 0;
    } else {
      project.paid_amount = installments?.reduce((sum, inst) => sum + Number(inst.amount), 0) || 0;
    }

    project.remaining_amount = project.total_amount - project.paid_amount;
    project.progress_percentage = project.total_amount > 0 
      ? Math.round((project.paid_amount / project.total_amount) * 100) 
      : 0;
  }

  return project;
}

// Add a new project
export async function addProject(data: Omit<Project, 'id' | 'created_at' | 'synced' | 'paid_amount' | 'remaining_amount' | 'progress_percentage'>) {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Couldn\'t create project:', error);
    throw error;
  }

  return project.id;
}

// Update a project
export async function updateProject(id: string, data: Partial<Project>) {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { error } = await supabase
    .from('projects')
    .update(data)
    .eq('id', id);

  if (error) {
    console.error('Couldn\'t update project:', error);
    throw error;
  }
}

// Investment functions
export async function getInvestments(profileId: string): Promise<Investment[]> {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('profile_id', profileId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Couldn\'t get investments:', error);
    throw error;
  }

  return data || [];
}

export async function addInvestment(data: Omit<Investment, 'id' | 'created_at' | 'synced'>) {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data: investment, error } = await supabase
    .from('investments')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Couldn\'t record investment:', error);
    throw error;
  }

  return investment.id;
}

// Enhanced dashboard stats with investments
export async function getEnhancedDashboardStats(profileId: string) {
  const basicStats = await getDashboardStats(profileId);
  
  if (!supabase) {
    return {
      ...basicStats,
      totalInvestment: 0,
      netProfit: 0,
      roi: 0
    };
  }

  // Get total investments
  const { data: investments, error: investmentError } = await supabase
    .from('investments')
    .select('amount')
    .eq('profile_id', profileId);

  const totalInvestment = investments?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
  const netProfit = basicStats.totalCollected - totalInvestment;
  const roi = totalInvestment > 0 ? Math.round((netProfit / totalInvestment) * 100) : 0;

  return {
    ...basicStats,
    totalInvestment,
    netProfit,
    roi
  };
}

// Get due installments (payments that should be made)
export async function getDueInstallments(profileId: string, daysAhead: number = 7) {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  // Get all active customers and their projects
  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select(`
      *,
      projects!inner(*)
    `)
    .eq('profile_id', profileId)
    .eq('is_active', true)
    .eq('projects.is_active', true);

  if (customerError) {
    console.error('Couldn\'t get customers for due installments:', customerError);
    throw customerError;
  }

  const dueInstallments = [];

  for (const customer of customers || []) {
    for (const project of customer.projects) {
      // Calculate how much has been paid for this project
      const { data: installments } = await supabase
        .from('installments')
        .select('amount, date')
        .eq('project_id', project.id);

      const paidAmount = installments?.reduce((sum, inst) => sum + Number(inst.amount), 0) || 0;
      const remainingAmount = project.total_amount - paidAmount;

      if (remainingAmount > 0) {
        // Calculate expected payment dates based on installment amount
        const installmentsNeeded = Math.ceil(remainingAmount / project.installment_amount);
        
        for (let i = 0; i < Math.min(installmentsNeeded, daysAhead); i++) {
          const dueDate = new Date(today);
          dueDate.setDate(today.getDate() + i);
          
          dueInstallments.push({
            customer_id: customer.id,
            customer_name: customer.name,
            project_id: project.id,
            project_name: project.name,
            amount: Math.min(project.installment_amount, remainingAmount),
            due_date: dueDate.toISOString().split('T')[0],
            remaining_amount: remainingAmount,
            is_overdue: false // We'll calculate this based on actual logic
          });
        }
      }
    }
  }

  return dueInstallments;
}
// Advanced Analytics Functions

export type AnalyticsTimeframe = 'week' | 'month' | 'quarter' | 'year';

export type CustomerAnalytics = {
  customer_id: string;
  customer_name: string;
  total_projects: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  completion_rate: number;
  avg_payment_amount: number;
  days_since_last_payment: number;
  payment_consistency: 'excellent' | 'good' | 'fair' | 'poor';
  risk_level: 'low' | 'medium' | 'high';
};

export type PaymentTrend = {
  period: string;
  total_collected: number;
  total_expected: number;
  collection_rate: number;
  unique_customers: number;
  avg_payment_size: number;
};

export type ProjectAnalytics = {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  avg_project_value: number;
  avg_completion_time: number;
  most_profitable_project_type: string;
  project_success_rate: number;
};

// Get comprehensive customer analytics
export async function getCustomerAnalytics(profileId: string): Promise<CustomerAnalytics[]> {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  // Get all customers with their projects and payments
  const { data: customers, error } = await supabase
    .from('customers')
    .select(`
      id,
      name,
      created_at,
      projects (
        id,
        total_amount,
        created_at,
        installments (
          amount,
          date,
          created_at
        )
      )
    `)
    .eq('profile_id', profileId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching customer analytics:', error);
    throw error;
  }

  const analytics: CustomerAnalytics[] = (customers || []).map(customer => {
    const projects = customer.projects || [];
    const allInstallments = projects.flatMap(p => p.installments || []);
    
    const totalAmount = projects.reduce((sum, p) => sum + p.total_amount, 0);
    const paidAmount = allInstallments.reduce((sum, i) => sum + i.amount, 0);
    const remainingAmount = totalAmount - paidAmount;
    const completionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
    
    // Calculate payment consistency
    const avgPaymentAmount = allInstallments.length > 0 
      ? paidAmount / allInstallments.length 
      : 0;
    
    // Days since last payment
    const lastPaymentDate = allInstallments.length > 0 
      ? Math.max(...allInstallments.map(i => new Date(i.date).getTime()))
      : 0;
    const daysSinceLastPayment = lastPaymentDate > 0 
      ? Math.floor((Date.now() - lastPaymentDate) / (1000 * 60 * 60 * 24))
      : 999;
    
    // Payment consistency rating
    let paymentConsistency: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (completionRate >= 90) paymentConsistency = 'excellent';
    else if (completionRate >= 70) paymentConsistency = 'good';
    else if (completionRate >= 50) paymentConsistency = 'fair';
    
    // Risk level assessment
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (daysSinceLastPayment > 30 || completionRate < 50) riskLevel = 'high';
    else if (daysSinceLastPayment > 14 || completionRate < 70) riskLevel = 'medium';
    
    return {
      customer_id: customer.id,
      customer_name: customer.name,
      total_projects: projects.length,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      completion_rate: Math.round(completionRate),
      avg_payment_amount: Math.round(avgPaymentAmount * 100) / 100,
      days_since_last_payment: daysSinceLastPayment,
      payment_consistency: paymentConsistency,
      risk_level: riskLevel
    };
  });

  return analytics.sort((a, b) => b.paid_amount - a.paid_amount);
}

// Get payment trends over time
export async function getPaymentTrends(profileId: string, timeframe: AnalyticsTimeframe = 'month'): Promise<PaymentTrend[]> {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  // Calculate date range based on timeframe
  const now = new Date();
  const periods = timeframe === 'week' ? 12 : timeframe === 'month' ? 12 : timeframe === 'quarter' ? 8 : 5;
  
  let dateFormat: string;
  let intervalUnit: string;
  
  switch (timeframe) {
    case 'week':
      dateFormat = 'YYYY-"W"WW';
      intervalUnit = 'week';
      break;
    case 'quarter':
      dateFormat = 'YYYY-"Q"Q';
      intervalUnit = 'quarter';
      break;
    case 'year':
      dateFormat = 'YYYY';
      intervalUnit = 'year';
      break;
    default:
      dateFormat = 'YYYY-MM';
      intervalUnit = 'month';
  }

  const startDate = new Date(now);
  if (timeframe === 'week') startDate.setDate(now.getDate() - (periods * 7));
  else if (timeframe === 'month') startDate.setMonth(now.getMonth() - periods);
  else if (timeframe === 'quarter') startDate.setMonth(now.getMonth() - (periods * 3));
  else startDate.setFullYear(now.getFullYear() - periods);

  // Get installments data
  const { data: installments, error } = await supabase
    .from('installments')
    .select(`
      amount,
      date,
      customer_id,
      customers!inner(profile_id)
    `)
    .eq('customers.profile_id', profileId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching payment trends:', error);
    throw error;
  }

  // Group by period
  const periodData: Record<string, {
    total_collected: number;
    customers: Set<string>;
    payments: number[];
  }> = {};

  (installments || []).forEach(installment => {
    const date = new Date(installment.date);
    let period: string;
    
    if (timeframe === 'week') {
      const weekNum = getWeekNumber(date);
      period = `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    } else if (timeframe === 'quarter') {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      period = `${date.getFullYear()}-Q${quarter}`;
    } else if (timeframe === 'year') {
      period = date.getFullYear().toString();
    } else {
      period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    
    if (!periodData[period]) {
      periodData[period] = {
        total_collected: 0,
        customers: new Set(),
        payments: []
      };
    }
    
    periodData[period].total_collected += installment.amount;
    periodData[period].customers.add(installment.customer_id);
    periodData[period].payments.push(installment.amount);
  });

  // Convert to trend data
  const trends: PaymentTrend[] = Object.entries(periodData).map(([period, data]) => ({
    period,
    total_collected: data.total_collected,
    total_expected: data.total_collected, // This would need more complex calculation
    collection_rate: 100, // Simplified for now
    unique_customers: data.customers.size,
    avg_payment_size: data.payments.length > 0 
      ? data.payments.reduce((sum, p) => sum + p, 0) / data.payments.length 
      : 0
  }));

  return trends.sort((a, b) => a.period.localeCompare(b.period));
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Get project analytics
export async function getProjectAnalytics(profileId: string): Promise<ProjectAnalytics> {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      total_amount,
      start_date,
      end_date,
      is_active,
      created_at,
      installments (
        amount,
        date
      )
    `)
    .eq('profile_id', profileId);

  if (error) {
    console.error('Error fetching project analytics:', error);
    throw error;
  }

  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter(p => p.is_active).length || 0;
  
  // Calculate completed projects (100% paid)
  const completedProjects = (projects || []).filter(project => {
    const paidAmount = (project.installments || []).reduce((sum, i) => sum + i.amount, 0);
    return paidAmount >= project.total_amount;
  }).length;

  const avgProjectValue = totalProjects > 0 
    ? (projects || []).reduce((sum, p) => sum + p.total_amount, 0) / totalProjects 
    : 0;

  // Calculate average completion time for completed projects
  const completedProjectsWithTime = (projects || []).filter(project => {
    const paidAmount = (project.installments || []).reduce((sum, i) => sum + i.amount, 0);
    return paidAmount >= project.total_amount && project.installments && project.installments.length > 0;
  });

  const avgCompletionTime = completedProjectsWithTime.length > 0
    ? completedProjectsWithTime.reduce((sum, project) => {
        const startDate = new Date(project.start_date);
        const lastPaymentDate = new Date(Math.max(...(project.installments || []).map(i => new Date(i.date).getTime())));
        const daysDiff = Math.floor((lastPaymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + daysDiff;
      }, 0) / completedProjectsWithTime.length
    : 0;

  const projectSuccessRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

  return {
    total_projects: totalProjects,
    active_projects: activeProjects,
    completed_projects: completedProjects,
    avg_project_value: Math.round(avgProjectValue * 100) / 100,
    avg_completion_time: Math.round(avgCompletionTime),
    most_profitable_project_type: 'General', // Simplified for now
    project_success_rate: Math.round(projectSuccessRate)
  };
}

// Get overdue payments
export async function getOverduePayments(profileId: string) {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const today = new Date().toISOString().split('T')[0];

  // This is a simplified version - in reality, you'd need more complex logic
  // to determine what payments are actually overdue based on payment schedules
  const { data: customers, error } = await supabase
    .from('customers')
    .select(`
      id,
      name,
      phone,
      projects (
        id,
        name,
        total_amount,
        installment_amount,
        installments (
          amount,
          date
        )
      )
    `)
    .eq('profile_id', profileId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching overdue payments:', error);
    throw error;
  }

  const overduePayments = [];

  for (const customer of customers || []) {
    for (const project of customer.projects || []) {
      const paidAmount = (project.installments || []).reduce((sum, i) => sum + i.amount, 0);
      const remainingAmount = project.total_amount - paidAmount;
      
      if (remainingAmount > 0) {
        // Find last payment date
        const lastPaymentDate = project.installments && project.installments.length > 0
          ? Math.max(...project.installments.map(i => new Date(i.date).getTime()))
          : 0;
        
        const daysSinceLastPayment = lastPaymentDate > 0
          ? Math.floor((Date.now() - lastPaymentDate) / (1000 * 60 * 60 * 24))
          : 999;
        
        // Consider overdue if no payment in 30 days (simplified logic)
        if (daysSinceLastPayment > 30) {
          overduePayments.push({
            customer_id: customer.id,
            customer_name: customer.name,
            customer_phone: customer.phone,
            project_id: project.id,
            project_name: project.name,
            overdue_amount: Math.min(project.installment_amount, remainingAmount),
            days_overdue: daysSinceLastPayment,
            total_remaining: remainingAmount
          });
        }
      }
    }
  }

  return overduePayments.sort((a, b) => b.days_overdue - a.days_overdue);
}

// Bulk operations
export async function bulkUpdateCustomerStatus(customerIds: string[], isActive: boolean) {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { error } = await supabase
    .from('customers')
    .update({ is_active: isActive })
    .in('id', customerIds);

  if (error) {
    console.error('Error in bulk customer update:', error);
    throw error;
  }

  return { success: true, updated: customerIds.length };
}

export async function bulkUpdateProjectStatus(projectIds: string[], isActive: boolean) {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  const { error } = await supabase
    .from('projects')
    .update({ is_active: isActive })
    .in('id', projectIds);

  if (error) {
    console.error('Error in bulk project update:', error);
    throw error;
  }

  return { success: true, updated: projectIds.length };
}

// Data export functions
export async function exportCustomerData(profileId: string, format: 'csv' | 'json' = 'csv') {
  const customers = await getCustomers(profileId);
  
  if (format === 'json') {
    return JSON.stringify(customers, null, 2);
  }
  
  // CSV format
  const headers = ['Name', 'Phone', 'Total Amount', 'Paid Amount', 'Remaining Amount', 'Created Date'];
  const csvRows = [
    headers.join(','),
    ...customers.map(customer => [
      `"${customer.name}"`,
      `"${customer.phone}"`,
      customer.total_amount,
      customer.paid_amount || 0,
      customer.remaining_amount || 0,
      `"${customer.created_at}"`
    ].join(','))
  ];
  
  return csvRows.join('\n');
}

export async function exportPaymentData(profileId: string, startDate?: string, endDate?: string, format: 'csv' | 'json' = 'csv') {
  if (!supabase) {
    throw new Error('Supabase isn\'t connected');
  }

  let query = supabase
    .from('installments')
    .select(`
      amount,
      date,
      created_at,
      customers!inner(name, phone, profile_id),
      projects(name)
    `)
    .eq('customers.profile_id', profileId)
    .order('date', { ascending: false });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data: payments, error } = await query;

  if (error) {
    console.error('Error exporting payment data:', error);
    throw error;
  }

  if (format === 'json') {
    return JSON.stringify(payments, null, 2);
  }

  // CSV format
  const headers = ['Date', 'Customer Name', 'Customer Phone', 'Project Name', 'Amount', 'Created Date'];
  const csvRows = [
    headers.join(','),
    ...(payments || []).map(payment => [
      `"${payment.date}"`,
      `"${(payment.customers as any)?.name || 'N/A'}"`,
      `"${(payment.customers as any)?.phone || 'N/A'}"`,
      `"${(payment.projects as any)?.name || 'N/A'}"`,
      payment.amount,
      `"${payment.created_at}"`
    ].join(','))
  ];

  return csvRows.join('\n');
}