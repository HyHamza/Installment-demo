import { supabase } from '@/lib/supabase';

// Just export our Supabase client so other files can use it
export default supabase;

// Quick check to see if our database is set up properly
export async function initSupabaseDb() {
  if (!supabase) {
    console.error('Oops! Supabase isn\'t connected. Double-check your .env.local file.');
    return;
  }

  console.log('Connected to Supabase database');
  
  try {
    // Let's see if our tables are there
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error && error.code === 'PGRST116') {
      console.log('Looks like you need to create the database tables first!');
      console.log('Head over to your Supabase dashboard and run the SQL from supabase-schema.sql');
    } else {
      console.log('Database is ready to go!');
    }
  } catch (error) {
    console.error('Something went wrong connecting to Supabase:', error);
  }
}