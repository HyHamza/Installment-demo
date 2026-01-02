'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { getAnalyticsData } from '@/app/actions/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Loading, SkeletonStats } from '@/components/Loading';
import { PullToRefresh } from '@/components/PullToRefresh';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';

type ReportTimeframe = 'week' | 'month' | 'quarter' | 'year';

export default function ReportsPage() {
  const { currentProfile } = useProfile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<ReportTimeframe>('month');

  const loadReportsData = async () => {
    if (!currentProfile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAnalyticsData(currentProfile.id, timeframe);
      setData(result);
    } catch (err) {
      setError('Failed to load reports data');
      console.error('Reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [currentProfile, timeframe]);

  const generateSummaryReport = () => {
    if (!data) return null;

    const totalCustomers = data.customerAnalytics.length;
    const activeProjects = data.projectAnalytics.active_projects;
    const completedProjects = data.projectAnalytics.completed_projects;
    const totalRevenue = data.customerAnalytics.reduce((sum: number, c: any) => sum + c.paid_amount, 0);
    const pendingAmount = data.customerAnalytics.reduce((sum: number, c: any) => sum + c.remaining_amount, 0);
    const avgProjectValue = data.projectAnalytics.avg_project_value;
    const successRate = data.projectAnalytics.project_success_rate;

    return {
      totalCustomers,
      activeProjects,
      completedProjects,
      totalRevenue,
      pendingAmount,
      avgProjectValue,
      successRate,
      overduePayments: data.overduePayments.length
    };
  };

  const summary = generateSummaryReport();

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
          <Button onClick={loadReportsData} size="mobile">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadReportsData}>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive business reports and insights
            </p>
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as ReportTimeframe)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Quick Report Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/analytics">
            <Card variant="mobile" interactive className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardContent className="flex items-center gap-3 py-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Analytics</h3>
                  <p className="text-sm text-blue-700">Detailed insights</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/export">
            <Card variant="mobile" interactive className="bg-gradient-to-r from-green-50 to-green-100">
              <CardContent className="flex items-center gap-3 py-4">
                <Download className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Export Data</h3>
                  <p className="text-sm text-green-700">Download reports</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/bulk">
            <Card variant="mobile" interactive className="bg-gradient-to-r from-purple-50 to-purple-100">
              <CardContent className="flex items-center gap-3 py-4">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-purple-900">Bulk Operations</h3>
                  <p className="text-sm text-purple-700">Manage multiple</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card variant="mobile" className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="flex items-center gap-3 py-4">
              <PieChart className="h-8 w-8 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">Custom Reports</h3>
                <p className="text-sm text-orange-700">Coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Executive Summary */}
        {loading && !data ? (
          <SkeletonStats />
        ) : summary ? (
          <Card variant="mobile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Executive Summary ({timeframe}ly)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{summary.totalCustomers}</div>
                  <div className="text-sm text-blue-600">Total Customers</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(summary.totalRevenue)}</div>
                  <div className="text-sm text-green-600">Total Revenue</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">{summary.activeProjects}</div>
                  <div className="text-sm text-purple-600">Active Projects</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">{summary.successRate}%</div>
                  <div className="text-sm text-orange-600">Success Rate</div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Financial Overview</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue Collected:</span>
                        <span className="font-medium text-green-600">{formatCurrency(summary.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending Amount:</span>
                        <span className="font-medium text-orange-600">{formatCurrency(summary.pendingAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Project Value:</span>
                        <span className="font-medium">{formatCurrency(summary.avgProjectValue)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Project Status</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Projects:</span>
                        <span className="font-medium text-blue-600">{summary.activeProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium text-green-600">{summary.completedProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium">{summary.successRate}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Customers:</span>
                        <span className="font-medium">{summary.totalCustomers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overdue Payments:</span>
                        <span className="font-medium text-red-600">{summary.overduePayments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Collection Rate:</span>
                        <span className="font-medium">
                          {summary.totalRevenue + summary.pendingAmount > 0 
                            ? Math.round((summary.totalRevenue / (summary.totalRevenue + summary.pendingAmount)) * 100)
                            : 0
                          }%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Report Categories */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="mobile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Financial Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/analytics" className="block">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <h4 className="font-medium">Revenue Analysis</h4>
                    <p className="text-sm text-gray-600">Income trends and projections</p>
                  </div>
                  <Eye className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
              
              <Link href="/admin" className="block">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <h4 className="font-medium">Investment ROI</h4>
                    <p className="text-sm text-gray-600">Return on investment analysis</p>
                  </div>
                  <Eye className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-50">
                <div>
                  <h4 className="font-medium">Profit & Loss</h4>
                  <p className="text-sm text-gray-600">Comprehensive P&L statement</p>
                </div>
                <span className="text-xs text-gray-500">Coming Soon</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="mobile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Customer Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/analytics" className="block">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <h4 className="font-medium">Customer Analytics</h4>
                    <p className="text-sm text-gray-600">Performance and risk analysis</p>
                  </div>
                  <Eye className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
              
              <Link href="/analytics" className="block">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <h4 className="font-medium">Payment Patterns</h4>
                    <p className="text-sm text-gray-600">Payment behavior insights</p>
                  </div>
                  <Eye className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-50">
                <div>
                  <h4 className="font-medium">Customer Segmentation</h4>
                  <p className="text-sm text-gray-600">Customer grouping analysis</p>
                </div>
                <span className="text-xs text-gray-500">Coming Soon</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card variant="mobile">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-purple-600" />
              Export & Download
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Link href="/export">
                <Button variant="secondary" size="mobile" fullWidth className="gap-2">
                  <FileText className="h-4 w-4" />
                  Export Data
                </Button>
              </Link>
              
              <Button variant="secondary" size="mobile" fullWidth className="gap-2" disabled>
                <Calendar className="h-4 w-4" />
                Schedule Reports
              </Button>
              
              <Button variant="secondary" size="mobile" fullWidth className="gap-2" disabled>
                <DollarSign className="h-4 w-4" />
                Tax Reports
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Some features are coming soon. Export functionality is available now.
            </p>
          </CardContent>
        </Card>
      </div>
    </PullToRefresh>
  );
}