'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { getAdminDashboardData } from '@/app/actions/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Loading, SkeletonStats } from '@/components/Loading';
import { PullToRefresh } from '@/components/PullToRefresh';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  PieChart,
  Calendar,
  Plus,
  Eye,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';

export default function AdminPage() {
  const { currentProfile } = useProfile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAdminData = async () => {
    if (!currentProfile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAdminDashboardData(currentProfile.id);
      setData(result);
    } catch (err) {
      setError('Failed to load admin data');
      console.error('Admin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
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
          <Button onClick={loadAdminData} size="mobile">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadAdminData}>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Business overview for {currentProfile.name}
            </p>
          </div>
          <Link href="/admin/investments/add">
            <Button size="mobile" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Investment</span>
              <span className="sm:hidden">Invest</span>
            </Button>
          </Link>
        </div>

        {/* Key Metrics */}
        {loading && !data ? (
          <SkeletonStats />
        ) : data ? (
          <>
            {/* Financial Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card variant="mobile" className="bg-gradient-to-r from-green-50 to-green-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Total Collected</CardTitle>
                  <DollarSign className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-green-700">
                    {formatCurrency(data.totalCollected)}
                  </div>
                  <p className="text-xs text-green-600 mt-1">Revenue to date</p>
                </CardContent>
              </Card>

              <Card variant="mobile" className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Total Investment</CardTitle>
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-blue-700">
                    {formatCurrency(data.totalInvestment)}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">Capital invested</p>
                </CardContent>
              </Card>

              <Card variant="mobile" className={`bg-gradient-to-r ${
                data.netProfit >= 0 
                  ? 'from-emerald-50 to-emerald-100' 
                  : 'from-red-50 to-red-100'
              }`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium ${
                    data.netProfit >= 0 ? 'text-emerald-800' : 'text-red-800'
                  }`}>
                    Net Profit
                  </CardTitle>
                  <TrendingUp className={`h-5 w-5 ${
                    data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl md:text-3xl font-bold ${
                    data.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(data.netProfit)}
                  </div>
                  <p className={`text-xs mt-1 ${
                    data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {data.netProfit >= 0 ? 'Profit earned' : 'Loss incurred'}
                  </p>
                </CardContent>
              </Card>

              <Card variant="mobile" className="bg-gradient-to-r from-purple-50 to-purple-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">ROI</CardTitle>
                  <Target className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-purple-700">
                    {data.roi}%
                  </div>
                  <p className="text-xs text-purple-600 mt-1">Return on investment</p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card variant="mobile">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-orange-600">
                    {formatCurrency(data.pendingAmount)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Still to collect</p>
                </CardContent>
              </Card>

              <Card variant="mobile">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expected Total</CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatCurrency(data.totalExpected)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">From all loans</p>
                </CardContent>
              </Card>

              <Card variant="mobile">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                  <PieChart className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-blue-600">
                    {data.totalExpected > 0 
                      ? Math.round((data.totalCollected / data.totalExpected) * 100)
                      : 0
                    }%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Of expected amount</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Investments */}
            {data.recentInvestments && data.recentInvestments.length > 0 && (
              <Card variant="mobile">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base md:text-lg">Recent Investments</CardTitle>
                    <Link href="/admin/investments">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.recentInvestments.slice(0, 5).map((investment: any) => (
                      <div key={investment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {investment.investment_type.replace('_', ' ').toUpperCase()}
                          </p>
                          {investment.description && (
                            <p className="text-xs text-gray-600">{investment.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {new Date(investment.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{formatCurrency(investment.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Customers */}
            {data.topCustomers && data.topCustomers.length > 0 && (
              <Card variant="mobile">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Top Customers by Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.topCustomers.map((customer: any, index: number) => (
                      <div key={customer.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{customer.name}</p>
                            <p className="text-xs text-gray-600">
                              {customer.completion_rate}% complete
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-green-600">
                            {formatCurrency(customer.collected)}
                          </p>
                          <p className="text-xs text-gray-500">
                            of {formatCurrency(customer.total_amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/admin/investments">
                <Card variant="mobile" interactive>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <TrendingDown className="h-8 w-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-center">View Investments</span>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/projects">
                <Card variant="mobile" interactive>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <Target className="h-8 w-8 text-purple-600 mb-2" />
                    <span className="text-sm font-medium text-center">Manage Projects</span>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/customers">
                <Card variant="mobile" interactive>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <Users className="h-8 w-8 text-green-600 mb-2" />
                    <span className="text-sm font-medium text-center">View Customers</span>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/daily">
                <Card variant="mobile" interactive>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <Calendar className="h-8 w-8 text-orange-600 mb-2" />
                    <span className="text-sm font-medium text-center">Daily Records</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </PullToRefresh>
  );
}