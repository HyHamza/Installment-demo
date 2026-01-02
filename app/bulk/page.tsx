'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { getCustomers, getProjects } from '@/db/actions';
import { bulkUpdateAction } from '@/app/actions/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Loading, SkeletonList } from '@/components/Loading';
import { 
  Users, 
  FolderOpen, 
  CheckSquare, 
  Square,
  Play,
  Pause,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

type Customer = {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  total_amount: number;
  paid_amount?: number;
  remaining_amount?: number;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  total_amount: number;
  paid_amount?: number;
  progress_percentage?: number;
};

export default function BulkOperationsPage() {
  const { currentProfile } = useProfile();
  const [activeTab, setActiveTab] = useState<'customers' | 'projects'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    if (currentProfile) {
      loadData();
    }
  }, [currentProfile, activeTab]);

  useEffect(() => {
    setSelectedItems([]);
  }, [activeTab]);

  const loadData = async () => {
    if (!currentProfile) return;
    
    setLoading(true);
    try {
      if (activeTab === 'customers') {
        const result = await getCustomers(currentProfile.id);
        setCustomers(result);
      } else {
        const result = await getProjects(currentProfile.id);
        setProjects(result);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const items = activeTab === 'customers' ? customers : projects;
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate') => {
    if (selectedItems.length === 0) return;

    setProcessing(true);
    setStatus({ type: null, message: '' });

    try {
      const result = await bulkUpdateAction(selectedItems, activeTab, action);
      
      if (result.success) {
        setStatus({
          type: 'success',
          message: result.message || 'Operation completed successfully'
        });
        setSelectedItems([]);
        await loadData(); // Reload data
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Bulk operation failed'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to perform bulk operation'
      });
      console.error('Bulk operation error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const currentItems = activeTab === 'customers' ? customers : projects;
  const allSelected = selectedItems.length === currentItems.length && currentItems.length > 0;
  const someSelected = selectedItems.length > 0 && selectedItems.length < currentItems.length;

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loading text="Loading Profile..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Bulk Operations</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage multiple customers or projects at once
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('customers')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeTab === 'customers'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <Users className="h-4 w-4" />
          Customers
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeTab === 'projects'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <FolderOpen className="h-4 w-4" />
          Projects
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <Card variant="mobile" className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedItems.length} {activeTab} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBulkAction('activate')}
                  isLoading={processing}
                  className="gap-1"
                >
                  <Play className="h-3 w-3" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBulkAction('deactivate')}
                  isLoading={processing}
                  className="gap-1"
                >
                  <Pause className="h-3 w-3" />
                  Deactivate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Message */}
      {status.type && (
        <div className={cn(
          'p-3 rounded-lg border',
          status.type === 'success'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        )}>
          <div className="flex items-center gap-2">
            {status.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <p className={cn(
              'text-sm font-medium',
              status.type === 'success' ? 'text-green-800' : 'text-red-800'
            )}>
              {status.message}
            </p>
          </div>
        </div>
      )}

      {/* Items List */}
      <Card variant="mobile">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {activeTab === 'customers' ? (
                <Users className="h-5 w-5 text-blue-600" />
              ) : (
                <FolderOpen className="h-5 w-5 text-purple-600" />
              )}
              {activeTab === 'customers' ? 'Customers' : 'Projects'}
            </CardTitle>
            
            {currentItems.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                {allSelected ? (
                  <CheckSquare className="h-4 w-4" />
                ) : someSelected ? (
                  <Square className="h-4 w-4 bg-blue-600 text-white" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <SkeletonList count={5} />
          ) : currentItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                {activeTab === 'customers' ? (
                  <Users className="h-12 w-12 mx-auto" />
                ) : (
                  <FolderOpen className="h-12 w-12 mx-auto" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No {activeTab} found
              </h3>
              <p className="text-gray-600">
                Create some {activeTab} to manage them in bulk
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                    selectedItems.includes(item.id)
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => handleSelectItem(item.id)}
                >
                  <div className="flex-shrink-0">
                    {selectedItems.includes(item.id) ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        item.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      )}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {activeTab === 'customers' ? (
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>{(item as Customer).phone}</span>
                        <span>{formatCurrency((item as Customer).total_amount)} total</span>
                        {(item as Customer).paid_amount !== undefined && (
                          <span>{formatCurrency((item as Customer).paid_amount!)} paid</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        {(item as Project).description && (
                          <span className="truncate">{(item as Project).description}</span>
                        )}
                        <span>{formatCurrency(item.total_amount)}</span>
                        {(item as Project).progress_percentage !== undefined && (
                          <span>{(item as Project).progress_percentage}% complete</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}