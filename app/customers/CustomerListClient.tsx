'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { fetchCustomers } from '@/app/actions/fetchers';
import { Customer } from '@/db/actions';
import { Input } from '@/components/Input';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { UserPlus, Search, Phone, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import Link from 'next/link';

export function CustomerListClient() {
  const { currentProfile } = useProfile();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    if (currentProfile) {
        setLoading(true);
        fetchCustomers(currentProfile.id)
            .then(setCustomers)
            .finally(() => setLoading(false));
    }
  }, [currentProfile]);

  const filteredCustomers = customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                            c.phone.includes(search);
      const isCompleted = (c.remaining_amount || 0) <= 0;

      if (filter === 'active') return matchesSearch && !isCompleted;
      if (filter === 'completed') return matchesSearch && isCompleted;
      return matchesSearch;
  });

  if (!currentProfile) return <div>Please select a profile.</div>;

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                    placeholder="Search by name or phone..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                 <div className="flex rounded-md shadow-sm">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 text-sm font-medium border rounded-l-md ${filter === 'all' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 text-sm font-medium border-t border-b ${filter === 'active' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 text-sm font-medium border rounded-r-md ${filter === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                        Completed
                    </button>
                 </div>
                 <Link href="/customers/add">
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Customer
                    </Button>
                 </Link>
            </div>
        </div>

        {loading ? (
            <div className="text-center py-10 text-gray-500">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                {search ? 'No customers found matching search.' : 'No customers found. Add one!'}
            </div>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCustomers.map(customer => (
                    <CustomerCard key={customer.id} customer={customer} />
                ))}
            </div>
        )}
    </div>
  );
}

function CustomerCard({ customer }: { customer: Customer }) {
    const progress = Math.min(100, ((customer.paid_amount || 0) / customer.total_amount) * 100);
    const isPaidOff = (customer.remaining_amount || 0) <= 0;

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {customer.photo_url ? (
                                <img src={customer.photo_url} alt={customer.name} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-lg font-bold text-gray-400">{customer.name.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                            <div className="flex items-center text-xs text-gray-500">
                                <Phone className="mr-1 h-3 w-3" />
                                {customer.phone}
                            </div>
                        </div>
                    </div>
                    {isPaidOff && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Paid</span>}
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Due</span>
                        <span className="font-medium">{formatCurrency(customer.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Remaining</span>
                        <span className="font-bold text-blue-600">{formatCurrency(customer.remaining_amount || 0)}</span>
                    </div>

                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${isPaidOff ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-gray-400">Installment: {formatCurrency(customer.installment_amount)}/day</span>
                        <Link href={`/customers/${customer.id}`}>
                            <Button variant="ghost" className="h-8 text-xs">View Details</Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
