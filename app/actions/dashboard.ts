'use server';

import { getDashboardStats } from '@/db/actions';
import { supabase } from '@/lib/supabase';

export async function getDashboardData(profileId: string) {
    const stats = await getDashboardStats(profileId);

    // Let's grab the last week's collection data for the chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    if (!supabase) {
        throw new Error('Supabase isn\'t connected');
    }

    // Get all payments from the last 7 days
    const { data: chartData, error } = await supabase
        .from('installments')
        .select(`
            date,
            amount,
            customers!inner(profile_id)
        `)
        .eq('customers.profile_id', profileId)
        .gte('date', dateStr)
        .order('date', { ascending: true });

    if (error) {
        console.error('Couldn\'t get chart data:', error);
        throw error;
    }

    // Now let's group everything by date and add up the totals
    const groupedData = (chartData || []).reduce((acc, item) => {
        const date = item.date;
        if (!acc[date]) {
            acc[date] = 0;
        }
        acc[date] += Number(item.amount);
        return acc;
    }, {} as Record<string, number>);

    // Turn it into the format our chart expects
    const formattedChartData = Object.entries(groupedData).map(([date, daily_total]) => ({
        date,
        daily_total
    }));

    return { ...stats, chartData: formattedChartData };
}
