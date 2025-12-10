

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ScheduleEvent, Photo, SocialLink } from '../types';
import { SCHEDULE_DATA, GALLERY_DATA, DEFAULT_HERO_IMAGE, SOCIAL_DATA, DEFAULT_PROFILE_IMAGE } from '../constants';

interface ContentContextType {
  schedule: ScheduleEvent[];
  gallery: Photo[];
  socialLinks: SocialLink[];
  heroImage: string;
  profileImage: string;
  addScheduleEvent: (event: ScheduleEvent) => void;
  updateScheduleEvent: (event: ScheduleEvent) => void;
  deleteScheduleEvent: (id: string) => void;
  addToGallery: (photo: Photo) => void;
  updateGalleryPhoto: (photo: Photo) => void; // Added for cropping updates
  removeFromGallery: (id: string) => void;
  updateHeroImage: (url: string) => void;
  updateProfileImage: (url: string) => void;
  addSocialLink: (link: SocialLink) => void;
  updateSocialLink: (link: SocialLink) => void;
  deleteSocialLink: (id: string) => void;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

const STORAGE_KEYS = {
    SCHEDULE: 'rilliex_schedule_v1',
    GALLERY: 'rilliex_gallery_v1',
    HERO: 'rilliex_hero_v1',
    SOCIAL: 'rilliex_social_v1',
    PROFILE: 'rilliex_profile_v1'
};

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage if available, else use Constants
  const [schedule, setSchedule] = useState<ScheduleEvent[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
      // Remove any previously saved schedule to ensure the app starts with no events
      if (saved) {
        try {
          localStorage.removeItem(STORAGE_KEYS.SCHEDULE);
        } catch (e) {
          console.error('Failed to remove saved schedule', e);
        }
      }
      return SCHEDULE_DATA;
  });

  const [gallery, setGallery] = useState<Photo[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.GALLERY);
      if (!saved) return GALLERY_DATA;
      try {
        const parsed = JSON.parse(saved) as Photo[];
        // If the saved gallery contains legacy remote images (e.g. Unsplash),
        // prefer the local `GALLERY_DATA` so media feed uses the repo images 1-12.
        const hasLegacyRemote = parsed.some(p => typeof p.url === 'string' && p.url.includes('images.unsplash.com'));
        if (hasLegacyRemote) return GALLERY_DATA;
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved gallery, falling back to defaults', e);
        return GALLERY_DATA;
      }
  });

  const [heroImage, setHeroImage] = useState<string>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.HERO);
      return saved ? saved : DEFAULT_HERO_IMAGE;
  });

  const [profileImage, setProfileImage] = useState<string>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!saved) return DEFAULT_PROFILE_IMAGE;
      try {
        // If saved profile was the old Unsplash default, replace with local default
        if (typeof saved === 'string' && saved.includes('images.unsplash.com')) {
          return DEFAULT_PROFILE_IMAGE;
        }
        return saved;
      } catch (e) {
        return DEFAULT_PROFILE_IMAGE;
      }
  });

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.SOCIAL);
      if (!saved) return SOCIAL_DATA;
      try {
        const parsed = JSON.parse(saved) as SocialLink[];
        // Merge saved links with defaults to ensure all platforms have correct URLs
        // For any platform that exists in both saved and SOCIAL_DATA, use the saved version
        // But ensure xiaohongshu and other platforms use the correct profile URLs
        const merged = SOCIAL_DATA.map(defaultLink => {
          const savedLink = parsed.find(s => s.platform === defaultLink.platform);
          return savedLink || defaultLink;
        });
        // Add any saved links that aren't in SOCIAL_DATA
        const additionalLinks = parsed.filter(s => !SOCIAL_DATA.some(d => d.platform === s.platform));
        return [...merged, ...additionalLinks];
      } catch (e) {
        console.error('Failed to parse saved social links, falling back to defaults', e);
        return SOCIAL_DATA;
      }
  });

  // --- Persistence Effects ---
  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
      try {
        localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(gallery));
      } catch (e) {
          console.error("Gallery quota exceeded", e);
          alert("Storage full! Try deleting some old photos.");
      }
  }, [gallery]);

  useEffect(() => {
      try {
        localStorage.setItem(STORAGE_KEYS.HERO, heroImage);
      } catch (e) {
        console.error("Hero image quota exceeded", e);
        alert("Image too large to save.");
      }
  }, [heroImage]);

  useEffect(() => {
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, profileImage);
      } catch (e) {
        console.error("Profile image quota exceeded", e);
      }
  }, [profileImage]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.SOCIAL, JSON.stringify(socialLinks));
  }, [socialLinks]);


  // --- Actions ---

  const addScheduleEvent = (event: ScheduleEvent) => {
    setSchedule(prev => [...prev, event]);
  };

  const updateScheduleEvent = (event: ScheduleEvent) => {
    setSchedule(prev => prev.map(e => e.id === event.id ? event : e));
  };

  const deleteScheduleEvent = (id: string) => {
    setSchedule(prev => prev.filter(e => e.id !== id));
  };

  const addToGallery = (photo: Photo) => {
    setGallery(prev => [photo, ...prev]);
  };

  const updateGalleryPhoto = (photo: Photo) => {
    setGallery(prev => prev.map(p => p.id === photo.id ? photo : p));
  };

  const removeFromGallery = (id: string) => {
    setGallery(prev => prev.filter(p => p.id !== id));
  };

  const updateHeroImage = (url: string) => {
    setHeroImage(url);
  }

  const updateProfileImage = (url: string) => {
    setProfileImage(url);
  }

  const addSocialLink = (link: SocialLink) => {
      setSocialLinks(prev => [...prev, link]);
  }

  const updateSocialLink = (link: SocialLink) => {
      setSocialLinks(prev => prev.map(l => l.id === link.id ? link : l));
  }

  const deleteSocialLink = (id: string) => {
      setSocialLinks(prev => prev.filter(l => l.id !== id));
  }

  return (
    <ContentContext.Provider value={{ 
      schedule, 
      gallery, 
      heroImage,
      profileImage,
      socialLinks,
      addScheduleEvent, 
      updateScheduleEvent, 
      deleteScheduleEvent,
      addToGallery,
      updateGalleryPhoto,
      removeFromGallery,
      updateHeroImage,
      updateProfileImage,
      addSocialLink,
      updateSocialLink,
      deleteSocialLink
    }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};