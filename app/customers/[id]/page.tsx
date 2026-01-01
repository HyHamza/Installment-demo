import { getCustomer, getInstallments } from '@/db/actions';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { format } from 'date-fns';
import { ArrowLeft, Phone, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const customer = await getCustomer(id);

    if (!customer) notFound();

    const installments = await getInstallments(id);
    const progress = Math.min(100, ((customer.paid_amount || 0) / customer.total_amount) * 100);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/customers" className="text-gray-500 hover:text-gray-900">
                    <ArrowLeft />
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Customer Details</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                {customer.photo_url ? (
                                    <img src={customer.photo_url} alt={customer.name} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-gray-400">{customer.name.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <CardTitle className="text-xl">{customer.name}</CardTitle>
                                <div className="flex items-center text-gray-500 mt-1">
                                    <Phone className="mr-1 h-4 w-4" />
                                    {customer.phone}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="text-sm text-gray-500">Total Amount</label>
                                    <div className="text-lg font-semibold">${customer.total_amount.toFixed(2)}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Daily Installment</label>
                                    <div className="text-lg font-semibold">${customer.installment_amount.toFixed(2)}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Paid Amount</label>
                                    <div className="text-lg font-semibold text-green-600">${(customer.paid_amount || 0).toFixed(2)}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Remaining</label>
                                    <div className="text-lg font-semibold text-blue-600">${(customer.remaining_amount || 0).toFixed(2)}</div>
                                </div>
                             </div>

                             <div className="mt-6">
                                <label className="text-sm text-gray-500 mb-2 block">Payment Progress</label>
                                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="text-right text-xs text-gray-500 mt-1">{progress.toFixed(1)}%</div>
                             </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {installments.length === 0 ? (
                                <div className="text-center py-6 text-gray-500">No payments yet.</div>
                            ) : (
                                <div className="space-y-4">
                                    {installments.map(inst => (
                                        <div key={inst.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                    <DollarSign size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">${inst.amount.toFixed(2)}</div>
                                                    <div className="text-xs text-gray-500 flex items-center">
                                                        <Calendar size={10} className="mr-1" />
                                                        {format(new Date(inst.date), 'MMM d, yyyy')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {format(new Date(inst.created_at), 'h:mm a')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {customer.document_url && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <img src={customer.document_url} alt="Document" className="rounded-lg w-full border" />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
