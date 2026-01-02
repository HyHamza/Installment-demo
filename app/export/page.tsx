'use client';

import React, { useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { exportDataAction } from '@/app/actions/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { 
  Download, 
  FileText, 
  Users, 
  CreditCard, 
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function ExportPage() {
  const { currentProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Form state
  const [dataType, setDataType] = useState<'customers' | 'payments'>('customers');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExport = async () => {
    if (!currentProfile) return;

    setLoading(true);
    setExportStatus({ type: null, message: '' });

    try {
      const result = await exportDataAction(
        currentProfile.id,
        dataType,
        format,
        startDate || undefined,
        endDate || undefined
      );

      if (result.success && result.data) {
        // Create and download file
        const blob = new Blob([result.data], { type: result.contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || 'export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setExportStatus({
          type: 'success',
          message: `Successfully exported ${dataType} data as ${format.toUpperCase()}`
        });
      } else {
        setExportStatus({
          type: 'error',
          message: result.error || 'Export failed'
        });
      }
    } catch (error) {
      setExportStatus({
        type: 'error',
        message: 'Failed to export data'
      });
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Profile Selected</h2>
          <p className="text-gray-600">Please select a profile to export data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Export Data</h1>
        <p className="text-sm text-gray-600 mt-1">
          Export your business data for backup or analysis
        </p>
      </div>

      {/* Export Form */}
      <Card variant="mobile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Export Configuration
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Data Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Data Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setDataType('customers')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  dataType === 'customers'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className={`h-6 w-6 ${
                    dataType === 'customers' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <h3 className="font-medium">Customers</h3>
                    <p className="text-sm text-gray-600">Customer details and totals</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setDataType('payments')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  dataType === 'payments'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className={`h-6 w-6 ${
                    dataType === 'payments' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <h3 className="font-medium">Payments</h3>
                    <p className="text-sm text-gray-600">Payment history and details</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('csv')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  format === 'csv'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`h-6 w-6 ${
                    format === 'csv' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <h3 className="font-medium">CSV</h3>
                    <p className="text-sm text-gray-600">Excel compatible format</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setFormat('json')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  format === 'json'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`h-6 w-6 ${
                    format === 'json' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <h3 className="font-medium">JSON</h3>
                    <p className="text-sm text-gray-600">Developer friendly format</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Date Range (for payments only) */}
          {dataType === 'payments' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Range (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  helperText="Leave empty for all dates"
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  helperText="Leave empty for all dates"
                />
              </div>
            </div>
          )}

          {/* Status Message */}
          {exportStatus.type && (
            <div className={`p-3 rounded-lg border ${
              exportStatus.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {exportStatus.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <p className={`text-sm font-medium ${
                  exportStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {exportStatus.message}
                </p>
              </div>
            </div>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExport}
            size="mobile"
            fullWidth
            isLoading={loading}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export {dataType} as {format.toUpperCase()}
          </Button>
        </CardContent>
      </Card>

      {/* Export Info */}
      <Card variant="mobile">
        <CardHeader>
          <CardTitle className="text-base">Export Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>
              <strong>Customer exports</strong> include name, phone, total amount, paid amount, 
              remaining amount, and creation date.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>
              <strong>Payment exports</strong> include date, customer details, project name, 
              amount, and creation timestamp.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>
              <strong>CSV format</strong> can be opened in Excel, Google Sheets, or any 
              spreadsheet application.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>
              <strong>JSON format</strong> is ideal for developers and can be imported 
              into other systems.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}