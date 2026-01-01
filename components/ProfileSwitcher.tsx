'use client';

import React from 'react';
import { useProfile } from './ProfileProvider';
import { ChevronDown, Store } from 'lucide-react';

export function ProfileSwitcher() {
  const { currentProfile, profiles, switchProfile } = useProfile();
  const [isOpen, setIsOpen] = React.useState(false);

  // Close dropdown on click outside
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  if (!currentProfile) return <div className="h-8 w-24 animate-pulse bg-gray-200 rounded"></div>;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Store size={14} />
        </div>
        <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{currentProfile.name}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
           <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
               Select Shop/Profile
           </div>
           {profiles.map(profile => (
               <button
                  key={profile.id}
                  onClick={() => {
                      switchProfile(profile.id);
                      setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${profile.id === currentProfile.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
               >
                   <Store size={14} />
                   {profile.name}
               </button>
           ))}
           <div className="border-t border-gray-100 mt-1 pt-1">
               <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-not-allowed" disabled>
                   + Add New Profile (Sooon)
               </button>
           </div>
        </div>
      )}
    </div>
  );
}
