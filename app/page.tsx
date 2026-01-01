'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { getDashboardData } from '@/app/actions/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { RevenueChart } from '@/components/RevenueChart';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
    const { currentProfile } = useProfile();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentProfile) {
            setLoading(true);
            getDashboardData(currentProfile.id)
                .then(setData)
                .finally(() => setLoading(false));
        }
    }, [currentProfile]);

    if (!currentProfile) return <div>Loading Profile...</div>;
    if (loading || !data) return <div>Loading Dashboard...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                        <DollarSign className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.totalCollected.toFixed(2)}</div>
                        <p className="text-xs text-gray-500">Total revenue to date</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">${data.pendingAmount.toFixed(2)}</div>
                        <p className="text-xs text-gray-500">Remaining to collect</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expected Total</CardTitle>
                        <Users className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.totalExpected.toFixed(2)}</div>
                        <p className="text-xs text-gray-500">From all active loans</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Collection Trend (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <RevenueChart data={data.chartData} />
                </CardContent>
            </Card>
        </div>
    );
}
