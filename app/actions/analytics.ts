'use server';

import { 
  getCustomerAnalytics, 
  getPaymentTrends, 
  getProjectAnalytics,
  getOverduePayments,
  exportCustomerData,
  exportPaymentData,
  bulkUpdateCustomerStatus,
  bulkUpdateProjectStatus,
  AnalyticsTimeframe
} from '@/db/actions';

export async function getAnalyticsData(profileId: string, timeframe: AnalyticsTimeframe = 'month') {
  try {
    const [customerAnalytics, paymentTrends, projectAnalytics, overduePayments] = await Promise.all([
      getCustomerAnalytics(profileId),
      getPaymentTrends(profileId, timeframe),
      getProjectAnalytics(profileId),
      getOverduePayments(profileId)
    ]);

    return {
      customerAnalytics,
      paymentTrends,
      projectAnalytics,
      overduePayments
    };
  } catch (error) {
    console.error('Failed to get analytics data:', error);
    throw error;
  }
}

export async function getCustomerRiskAnalysis(profileId: string) {
  try {
    const analytics = await getCustomerAnalytics(profileId);
    
    const riskSummary = {
      high_risk: analytics.filter(c => c.risk_level === 'high').length,
      medium_risk: analytics.filter(c => c.risk_level === 'medium').length,
      low_risk: analytics.filter(c => c.risk_level === 'low').length,
      total_customers: analytics.length
    };

    const topRiskyCustomers = analytics
      .filter(c => c.risk_level === 'high')
      .slice(0, 10);

    return {
      riskSummary,
      topRiskyCustomers,
      allCustomers: analytics
    };
  } catch (error) {
    console.error('Failed to get customer risk analysis:', error);
    throw error;
  }
}

export async function exportDataAction(
  profileId: string, 
  dataType: 'customers' | 'payments',
  format: 'csv' | 'json' = 'csv',
  startDate?: string,
  endDate?: string
) {
  try {
    let data: string;
    let filename: string;
    
    if (dataType === 'customers') {
      data = await exportCustomerData(profileId, format);
      filename = `customers_export_${new Date().toISOString().split('T')[0]}.${format}`;
    } else {
      data = await exportPaymentData(profileId, startDate, endDate, format);
      filename = `payments_export_${new Date().toISOString().split('T')[0]}.${format}`;
    }

    return {
      success: true,
      data,
      filename,
      contentType: format === 'csv' ? 'text/csv' : 'application/json'
    };
  } catch (error) {
    console.error('Failed to export data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    };
  }
}

export async function bulkUpdateAction(
  ids: string[],
  type: 'customers' | 'projects',
  action: 'activate' | 'deactivate'
) {
  try {
    const isActive = action === 'activate';
    let result;

    if (type === 'customers') {
      result = await bulkUpdateCustomerStatus(ids, isActive);
    } else {
      result = await bulkUpdateProjectStatus(ids, isActive);
    }

    return {
      success: true,
      message: `Successfully ${action}d ${result.updated} ${type}`,
      updated: result.updated
    };
  } catch (error) {
    console.error('Failed to perform bulk update:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bulk update failed'
    };
  }
}