'use server';

import { revalidatePath } from 'next/cache';
import { addInvestment, getInvestments } from '@/db/actions';

export async function createInvestmentAction(formData: FormData) {
  try {
    const profileId = formData.get('profile_id') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const investmentType = formData.get('investment_type') as 'capital' | 'loan' | 'profit_reinvestment';
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    if (!profileId || !amount || !investmentType || !date) {
      throw new Error('Missing required fields');
    }

    const investmentData = {
      profile_id: profileId,
      amount,
      investment_type: investmentType,
      description: description || null,
      date
    };

    const investmentId = await addInvestment(investmentData);

    // Revalidate relevant pages
    revalidatePath('/admin');
    revalidatePath('/investments');
    revalidatePath('/');

    return { success: true, investmentId };
  } catch (error) {
    console.error('Failed to create investment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to record investment' 
    };
  }
}

export async function getInvestmentData(profileId: string) {
  try {
    const investments = await getInvestments(profileId);
    
    // Calculate investment summary
    const summary = investments.reduce((acc, investment) => {
      acc.total += investment.amount;
      acc.byType[investment.investment_type] = (acc.byType[investment.investment_type] || 0) + investment.amount;
      return acc;
    }, {
      total: 0,
      byType: {} as Record<string, number>
    });

    // Group by month for chart data
    const monthlyData = investments.reduce((acc, investment) => {
      const month = investment.date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + investment.amount;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    return {
      investments,
      summary,
      chartData
    };
  } catch (error) {
    console.error('Failed to get investment data:', error);
    throw error;
  }
}