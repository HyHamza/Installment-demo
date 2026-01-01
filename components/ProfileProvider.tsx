'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  name: string;
};

type ProfileContextType = {
  currentProfile: Profile | null;
  profiles: Profile[];
  switchProfile: (profileId: string) => void;
  isLoading: boolean;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children, initialProfiles }: { children: React.ReactNode, initialProfiles: Profile[] }) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(initialProfiles[0] || null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Load from localStorage on mount if available
  useEffect(() => {
    const savedId = localStorage.getItem('currentProfileId');
    if (savedId) {
      const found = profiles.find(p => p.id === savedId);
      if (found) setCurrentProfile(found);
    }
  }, [profiles]);

  const switchProfile = (profileId: string) => {
    const found = profiles.find(p => p.id === profileId);
    if (found) {
        setCurrentProfile(found);
        localStorage.setItem('currentProfileId', profileId);
        router.refresh();
    }
  };

  return (
    <ProfileContext.Provider value={{ currentProfile, profiles, switchProfile, isLoading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
