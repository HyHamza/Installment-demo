// We need a server component wrapper to fetch initial profiles and pass them to the client provider
import React from 'react';
import { getProfiles } from '@/db/actions';
import { ProfileProvider } from './ProfileProvider';

export async function ProfileProviderWrapper({ children }: { children: React.ReactNode }) {
  let profiles = await getProfiles();

  // fallback if something is wrong with init (shouldn't happen due to setup.ts)
  if (profiles.length === 0) {
      profiles = [{ id: 'default-profile', name: 'My Shop' }];
  }

  return (
    <ProfileProvider initialProfiles={profiles}>
      {children}
    </ProfileProvider>
  );
}
