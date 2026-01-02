'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { getDashboardData } from '@/app/actions/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { RevenueChart } from '@/components/RevenueChart';
import { Loading, SkeletonStats } from '@/components/Loading';
import { PullToRefresh } from '@/components/PullToRefresh';
import { DollarSign, Users, TrendingUp, RefreshCw, CheckSquare } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export default function DashboardPage() {
    const { currentProfile } = useProfile();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDashboardData = async () => {
        if (!currentProfile) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const result = await getDashboardData(currentProfile.id);
            setData(result);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [currentProfile]);

    if (!currentProfile) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loading text="Loading Profile..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadDashboardData}
                        className="btn-mobile-primary"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <PullToRefresh onRefresh={loadDashboardData}>
            <div className="space-y-4 md:space-y-6">
                {/* Mobile-first header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">Dashboard</h1>
                    <div className="text-sm text-gray-500">
                        {currentProfile.name}
                    </div>
                </div>

                {/* Stats cards with mobile-first design */}
                {loading && !data ? (
                    <SkeletonStats />
                ) : data ? (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card variant="mobile" className="bg-gradient-to-r from-green-50 to-green-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-800">Total Collected</CardTitle>
                                <DollarSign className="h-5 w-5 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl md:text-3xl font-bold text-green-700">
                                    {formatCurrency(data.totalCollected)}
                                </div>
                                <p className="text-xs text-green-600 mt-1">Total revenue to date</p>
                            </CardContent>
                        </Card>

                        <Card variant="mobile" className="bg-gradient-to-r from-orange-50 to-orange-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-orange-800">Pending Amount</CardTitle>
                                <TrendingUp className="h-5 w-5 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl md:text-3xl font-bold text-orange-700">
                                    {formatCurrency(data.pendingAmount)}
                                </div>
                                <p className="text-xs text-orange-600 mt-1">Remaining to collect</p>
                            </CardContent>
                        </Card>

                        <Card variant="mobile" className="bg-gradient-to-r from-blue-50 to-blue-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-blue-800">Expected Total</CardTitle>
                                <Users className="h-5 w-5 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl md:text-3xl font-bold text-blue-700">
                                    {formatCurrency(data.totalExpected)}
                                </div>
                                <p className="text-xs text-blue-600 mt-1">From all active loans</p>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}

                {/* Chart section with mobile optimization */}
                {data && (
                    <Card variant="mobile">
                        <CardHeader>
                            <CardTitle className="text-base md:text-lg">Collection Trend (Last 7 Days)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-64 md:h-80">
                                <RevenueChart data={data.chartData} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick actions for mobile */}
                <div className="grid grid-cols-2 gap-4 md:hidden">
                    <Card variant="mobile" interactive>
                        <CardContent className="flex flex-col items-center justify-center py-6">
                            <Users className="h-8 w-8 text-blue-600 mb-2" />
                            <span className="text-sm font-medium">View Customers</span>
                        </CardContent>
                    </Card>
                    <Card variant="mobile" interactive>
                        <CardContent className="flex flex-col items-center justify-center py-6">
                            <CheckSquare className="h-8 w-8 text-green-600 mb-2" />
                            <span className="text-sm font-medium">Daily Tick</span>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PullToRefresh>
    );
}
