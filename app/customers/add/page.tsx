'use client';

import React, { useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { createCustomerAction } from '@/app/actions/customer';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { ImageUpload } from '@/components/ImageUpload';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddCustomerPage() {
  const { currentProfile } = useProfile();
  const [photoUrl, setPhotoUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // We wrap the server action to add client-side loading state
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentProfile) return alert('No profile selected');

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append('profileId', currentProfile.id);
    formData.append('photoUrl', photoUrl);
    formData.append('documentUrl', documentUrl);

    try {
        await createCustomerAction(formData);
    } catch (error) {
        console.error(error);
        alert('Failed to add customer');
        setIsSubmitting(false);
    }
  };

  if (!currentProfile) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add New Customer</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Details - {currentProfile.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Input name="name" label="Full Name" required placeholder="John Doe" />
              <Input name="phone" label="Phone Number" required placeholder="+1 234 567 890" />

              <Input
                name="totalAmount"
                label="Total Amount"
                type="number"
                step="0.01"
                required
                placeholder="1000.00"
              />
              <Input
                name="installmentAmount"
                label="Daily Installment"
                type="number"
                step="0.01"
                required
                placeholder="50.00"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <ImageUpload label="Customer Photo" onUpload={setPhotoUrl} folder="customer-photos" />
                <ImageUpload label="ID Proof / Document" onUpload={setDocumentUrl} folder="customer-docs" />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/customers">
                 <Button type="button" variant="secondary">Cancel</Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting}>
                Save Customer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
