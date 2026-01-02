'use server';

import { getDashboardStats, getEnhancedDashboardStats } from '@/db/actions';
import { supabase } from '@/lib/supabase';

export async function getDashboardData(profileId: string) {
    const stats = await getEnhancedDashboardStats(profileId);

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

    return {
        ...stats,
        chartData: formattedChartData
    };
}

export async function getAdminDashboardData(profileId: string) {
    try {
        const stats = await getEnhancedDashboardStats(profileId);
        
        // Get monthly collection trend (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        const monthStr = twelveMonthsAgo.toISOString().substring(0, 7); // YYYY-MM

        if (!supabase) {
            throw new Error('Supabase isn\'t connected');
        }

        // Get monthly collections
        const { data: monthlyData, error: monthlyError } = await supabase
            .from('installments')
            .select(`
                date,
                amount,
                customers!inner(profile_id)
            `)
            .eq('customers.profile_id', profileId)
            .gte('date', monthStr + '-01')
            .order('date', { ascending: true });

        if (monthlyError) {
            console.error('Couldn\'t get monthly data:', monthlyError);
            throw monthlyError;
        }

        // Group by month
        const monthlyGrouped = (monthlyData || []).reduce((acc, item) => {
            const month = item.date.substring(0, 7); // YYYY-MM
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month] += Number(item.amount);
            return acc;
        }, {} as Record<string, number>);

        const monthlyChartData = Object.entries(monthlyGrouped).map(([month, total]) => ({
            month,
            total
        }));

        // Get investment data
        const { data: investments, error: investmentError } = await supabase
            .from('investments')
            .select('*')
            .eq('profile_id', profileId)
            .order('date', { ascending: false })
            .limit(10);

        const recentInvestments = investments || [];

        // Get top customers by collection
        const { data: topCustomers, error: customerError } = await supabase
            .from('customers')
            .select(`
                id,
                name,
                total_amount,
                installments(amount)
            `)
            .eq('profile_id', profileId)
            .eq('is_active', true);

        const customersWithCollections = (topCustomers || []).map(customer => {
            const collected = customer.installments?.reduce((sum: number, inst: any) => sum + Number(inst.amount), 0) || 0;
            return {
                ...customer,
                collected,
                remaining: customer.total_amount - collected,
                completion_rate: customer.total_amount > 0 ? Math.round((collected / customer.total_amount) * 100) : 0
            };
        }).sort((a, b) => b.collected - a.collected).slice(0, 5);

        return {
            ...stats,
            monthlyChartData,
            recentInvestments,
            topCustomers: customersWithCollections
        };
    } catch (error) {
        console.error('Failed to get admin dashboard data:', error);
        throw error;
    }
}
