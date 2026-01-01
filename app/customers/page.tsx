import { getCustomers } from '@/db/actions';
import { CustomerListClient } from './CustomerListClient';

export default async function CustomersPage() {
    // Initial fetch happens on client side for profile filtering usually,
    // but since we want SEO/Server rendering, we might need to know the profile ID.
    // However, the profile ID is in Client Context.
    // Strategy: Render a client component that fetches data based on the selected profile context.
    // OR: Since this is an "Installment App" likely behind a login or local,
    // we can rely on Client Component fetching or passing data via Server Actions invoked from useEffect.

    // For simplicity and "Multi-Profile" support which is client-side state:
    // We will use a Client Component that calls a Server Action to get customers.

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
             </div>
             <CustomerListClient />
        </div>
    );
}
