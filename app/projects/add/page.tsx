'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/components/ProfileProvider';
import { getCustomers } from '@/db/actions';
import { createProjectAction } from '@/app/actions/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loading } from '@/components/Loading';
import { ArrowLeft, FolderPlus, User, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

type Customer = {
  id: string;
  name: string;
  phone: string;
  total_amount: number;
  paid_amount?: number;
  remaining_amount?: number;
};

export default function AddProjectPage() {
  const router = useRouter();
  const { currentProfile } = useProfile();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (currentProfile) {
      loadCustomers();
    }
  }, [currentProfile]);

  const loadCustomers = async () => {
    if (!currentProfile) return;
    
    setLoading(true);
    try {
      const result = await getCustomers(currentProfile.id);
      setCustomers(result);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Customers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentProfile || !selectedCustomerId || !projectName || !totalAmount || !installmentAmount) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('customer_id', selectedCustomerId);
      formData.append('profile_id', currentProfile.id);
      formData.append('name', projectName);
      formData.append('description', description);
      formData.append('total_amount', totalAmount);
      formData.append('installment_amount', installmentAmount);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);

      const result = await createProjectAction(formData);
      
      if (result.success) {
        router.push('/projects');
      } else {
        setError(result.error || 'Failed to create project');
      }
    } catch (err) {
      setError('Failed to create project');
      console.error('Create project error:', err);
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="mobile" className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Add New Project</h1>
          <p className="text-sm text-gray-600 mt-1">Create a project for a customer</p>
        </div>
      </div>

      {/* Form */}
      <Card variant="mobile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-blue-600" />
            Project Details
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Customer *
              </label>
              {loading ? (
                <div className="input-mobile flex items-center justify-center">
                  <Loading size="sm" />
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="input-mobile"
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Project Name */}
            <Input
              label="Project Name *"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Home Renovation, Business Loan"
              required
              leftIcon={<FolderPlus className="h-4 w-4" />}
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional project description..."
                className="input-mobile min-h-[80px] resize-none"
                rows={3}
              />
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Total Amount *"
                type="number"
                step="0.01"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                required
                leftIcon={<DollarSign className="h-4 w-4" />}
              />

              <Input
                label="Installment Amount *"
                type="number"
                step="0.01"
                min="0"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                placeholder="0.00"
                required
                leftIcon={<DollarSign className="h-4 w-4" />}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date *"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                leftIcon={<Calendar className="h-4 w-4" />}
              />

              <Input
                label="End Date (Optional)"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                leftIcon={<Calendar className="h-4 w-4" />}
                helperText="Leave empty for open-ended projects"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Link href="/projects" className="flex-1">
                <Button variant="secondary" size="mobile" fullWidth>
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                size="mobile" 
                fullWidth 
                isLoading={submitting}
                className="flex-1"
              >
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}