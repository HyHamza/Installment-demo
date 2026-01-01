'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { getDailyData } from '@/app/actions/daily';
import { markDailyPayment } from '@/app/actions/installment';
import { Customer, Installment } from '@/db/actions';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

export default function DailyTickPage() {
    const { currentProfile } = useProfile();
    // Using simple date string YYYY-MM-DD
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [todaysInstallments, setTodaysInstallments] = useState<Installment[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        if (currentProfile) {
            loadData();
        }
    }, [currentProfile, date]);

    const loadData = async () => {
        if (!currentProfile) return;
        setLoading(true);
        try {
            const { customers: c, installments: i } = await getDailyData(currentProfile.id, date);
            // Filter out completed customers unless they paid today
            const activeOrPaidToday = c.filter(cust => {
                const paidToday = i.some(inst => inst.customer_id === cust.id);
                const isCompleted = (cust.remaining_amount || 0) <= 0;
                return !isCompleted || paidToday;
            });

            setCustomers(activeOrPaidToday);
            setTodaysInstallments(i);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleTick = async (customer: Customer) => {
        if (processing) return;

        const isPaid = todaysInstallments.some(i => i.customer_id === customer.id);
        if (isPaid) return; // Already paid, maybe allow undo later? keeping simple.

        setProcessing(customer.id);
        try {
            await markDailyPayment(customer.id, customer.installment_amount, date);
            // Optimistic update or reload
            await loadData();
        } catch (error) {
            alert('Failed to mark payment');
        } finally {
            setProcessing(null);
        }
    };

    if (!currentProfile) return <div>Select a profile</div>;

    // Sort: Unpaid first, then Paid
    const sortedCustomers = [...customers].sort((a, b) => {
        const aPaid = todaysInstallments.some(i => i.customer_id === a.id);
        const bPaid = todaysInstallments.some(i => i.customer_id === b.id);
        if (aPaid === bPaid) return a.name.localeCompare(b.name);
        return aPaid ? 1 : -1;
    });

    const totalCollectedToday = todaysInstallments.reduce((sum, i) => sum + i.amount, 0);
    const totalExpectedToday = customers.length > 0 ? customers.reduce((sum, c) => sum + c.installment_amount, 0) : 0; // Rough estimate

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Daily Collection</h1>
                    <p className="text-gray-500 text-sm">Mark daily payments for {format(new Date(date), 'MMMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                     <CalendarIcon className="h-5 w-5 text-gray-500" />
                     <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                     />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                 <Card className="bg-blue-50 border-blue-100">
                     <CardContent className="p-4 flex flex-col">
                         <span className="text-sm text-blue-600 font-medium">Collected Today</span>
                         <span className="text-2xl font-bold text-blue-700">${totalCollectedToday.toFixed(2)}</span>
                     </CardContent>
                 </Card>
                 <Card className="bg-gray-50 border-gray-100">
                     <CardContent className="p-4 flex flex-col">
                         <span className="text-sm text-gray-600 font-medium">Count</span>
                         <span className="text-2xl font-bold text-gray-700">{todaysInstallments.length} / {customers.length}</span>
                     </CardContent>
                 </Card>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : sortedCustomers.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No active customers found for this profile.</div>
            ) : (
                <div className="bg-white rounded-lg border shadow-sm divide-y">
                    {sortedCustomers.map(customer => {
                        const isPaid = todaysInstallments.some(i => i.customer_id === customer.id);
                        return (
                            <div key={customer.id} className={`p-4 flex items-center justify-between transition-colors ${isPaid ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-4">
                                    <div
                                        onClick={() => !isPaid && handleTick(customer)}
                                        className={`cursor-pointer ${isPaid ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'}`}
                                    >
                                        {processing === customer.id ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                        ) : isPaid ? (
                                            <CheckCircle2 className="h-6 w-6" />
                                        ) : (
                                            <Circle className="h-6 w-6" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{customer.name}</div>
                                        <div className="text-sm text-gray-500">
                                            Due: ${customer.installment_amount}
                                            <span className="mx-2">•</span>
                                            Rem: ${(customer.remaining_amount || 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {isPaid && (
                                    <span className="text-xs font-medium text-green-600 px-2 py-1 bg-green-100 rounded-full">Paid</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
