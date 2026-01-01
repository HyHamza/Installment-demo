-- Let's set up our database tables for the installment app

-- First, the profiles table (think of this as different shops or users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now the customers table (all the people who owe money)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    installment_amount DECIMAL(10,2) NOT NULL,
    photo_url TEXT,
    document_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced BOOLEAN DEFAULT false
);

-- And finally, the installments table (all the payments people make)
CREATE TABLE IF NOT EXISTS public.installments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced BOOLEAN DEFAULT false
);

-- Add some indexes to make things faster
CREATE INDEX IF NOT EXISTS idx_customers_profile_id ON public.customers(profile_id);
CREATE INDEX IF NOT EXISTS idx_installments_customer_id ON public.installments(customer_id);
CREATE INDEX IF NOT EXISTS idx_installments_date ON public.installments(date);

-- Turn on security (you can customize these rules later)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

-- For now, let's allow everything (you should make these more restrictive later)
CREATE POLICY "Allow all operations on profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow all operations on installments" ON public.installments FOR ALL USING (true);