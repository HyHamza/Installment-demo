'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { getAnalyticsData, getCustomerRiskAnalysis } from '@/app/actions/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Loading, SkeletonStats } from '@/components/Loading';
import { PullToRefresh } from '@/components/PullToRefresh';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Target,
  Calendar,
  DollarSign,
  PieChart,
  Download,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

type AnalyticsTimeframe = 'week' | 'month' | 'quarter' | 'year';

export default function AnalyticsPage() {
  const { currentProfile } = useProfile();
  const [data, setData] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('month');

  const loadAnalyticsData = async () => {
    if (!currentProfile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [analyticsResult, riskResult] = await Promise.all([
        getAnalyticsData(currentProfile.id, timeframe),
        getCustomerRiskAnalysis(currentProfile.id)
      ]);
      
      setData(analyticsResult);
      setRiskData(riskResult);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [currentProfile, timeframe]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-700 bg-red-100';
      case 'medium': return 'text-orange-700 bg-orange-100';
      case 'low': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getConsistencyColor = (consistency: string) => {
    switch (consistency) {
      case 'excellent': return 'text-emerald-700 bg-emerald-100';
      case 'good': return 'text-green-700 bg-green-100';
      case 'fair': return 'text-yellow-700 bg-yellow-100';
      case 'poor': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

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
          <Button onClick={loadAnalyticsData} size="mobile">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadAnalyticsData}>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">
              Business insights and performance metrics
            </p>
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as AnalyticsTimeframe)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        </div>

        {loading && !data ? (
          <SkeletonStats />
        ) : data ? (
          <>
            {/* Project Analytics Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card variant="mobile" className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Total Projects</CardTitle>
                  <Target className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-blue-700">
                    {data.projectAnalytics.total_projects}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {data.projectAnalytics.active_projects} active
                  </p>
                </CardContent>
              </Card>

              <Card variant="mobile" className="bg-gradient-to-r from-green-50 to-green-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Success Rate</CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-green-700">
                    {data.projectAnalytics.project_success_rate}%
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {data.projectAnalytics.completed_projects} completed
                  </p>
                </CardContent>
              </Card>

              <Card variant="mobile" className="bg-gradient-to-r from-purple-50 to-purple-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Avg Project Value</CardTitle>
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-purple-700">
                    {formatCurrency(data.projectAnalytics.avg_project_value)}
                  </div>
                  <p className="text-xs text-purple-600 mt-1">Per project</p>
                </CardContent>
              </Card>

              <Card variant="mobile" className="bg-gradient-to-r from-orange-50 to-orange-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">Avg Completion</CardTitle>
                  <Calendar className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-orange-700">
                    {data.projectAnalytics.avg_completion_time}
                  </div>
                  <p className="text-xs text-orange-600 mt-1">Days average</p>
                </CardContent>
              </Card>
            </div>

            {/* Risk Analysis */}
            {riskData && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card variant="mobile">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Customer Risk Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">High Risk</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full"
                              style={{ 
                                width: `${(riskData.riskSummary.high_risk / riskData.riskSummary.total_customers) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">{riskData.riskSummary.high_risk}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Medium Risk</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full"
                              style={{ 
                                width: `${(riskData.riskSummary.medium_risk / riskData.riskSummary.total_customers) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">{riskData.riskSummary.medium_risk}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Low Risk</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ 
                                width: `${(riskData.riskSummary.low_risk / riskData.riskSummary.total_customers) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">{riskData.riskSummary.low_risk}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Overdue Payments */}
                <Card variant="mobile">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Overdue Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.overduePayments.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">No overdue payments</p>
                        <p className="text-xs text-green-600 mt-1">All payments are up to date!</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                        {data.overduePayments.slice(0, 5).map((payment: any) => (
                          <div key={`${payment.customer_id}-${payment.project_id}`} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="font-medium text-sm">{payment.customer_name}</p>
                              <p className="text-xs text-gray-600">{payment.project_name}</p>
                              <p className="text-xs text-red-600">{payment.days_overdue} days overdue</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm text-red-600">
                                {formatCurrency(payment.overdue_amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {data.overduePayments.length > 5 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            +{data.overduePayments.length - 5} more overdue payments
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Customer Performance */}
            <Card variant="mobile">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Top Customer Performance
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                  {data.customerAnalytics.slice(0, 10).map((customer: any) => (
                    <div key={customer.customer_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{customer.customer_name}</p>
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            getRiskColor(customer.risk_level)
                          )}>
                            {customer.risk_level}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>{customer.total_projects} projects</span>
                          <span className={cn(
                            'px-2 py-1 rounded-full font-medium',
                            getConsistencyColor(customer.payment_consistency)
                          )}>
                            {customer.payment_consistency}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-green-600">
                          {formatCurrency(customer.paid_amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer.completion_rate}% complete
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Trends */}
            {data.paymentTrends.length > 0 && (
              <Card variant="mobile">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Payment Trends ({timeframe}ly)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.paymentTrends.slice(-6).map((trend: any) => (
                      <div key={trend.period} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-sm">{trend.period}</p>
                          <p className="text-xs text-gray-600">
                            {trend.unique_customers} customers
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {formatCurrency(trend.total_collected)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Avg: {formatCurrency(trend.avg_payment_size)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </PullToRefresh>
  );
}