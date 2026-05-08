import { useQuery } from '@tanstack/react-query';

const API_URL = 'https://kashmir-curators-api.onrender.com/api';

// Types for CMS data
export interface CMSPackage {
  id: string;
  name: string;
  destination: string;
  duration: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: Array<{ day: number; title: string; description: string; activities?: string[] }>;
}

export interface CMSHotel {
  id: string;
  name: string;
  location: string;
  starRating: number;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  image: string;
  description: string;
  amenities: string[];
  roomTypes: Array<{ id: string; name: string; price: number; capacity: number }>;
}

export interface CMSCab {
  id: string;
  type: string;
  name: string;
  capacity: number;
  pricePerKm: number;
  basePrice: number;
  image: string;
  features: string[];
}

export interface CMSTestimonial {
  id: string;
  name: string;
  location: string;
  tripType: string;
  avatar: string;
  text: string;
  rating: number;
}

// Hooks
export function usePackages() {
  return useQuery({
    queryKey: ['cms-packages'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/packages`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      return response.json() as Promise<CMSPackage[]>;
    },
  });
}

export function useFeaturedPackages() {
  return useQuery({
    queryKey: ['cms-featured-packages'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/packages`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      const data = await response.json() as CMSPackage[];
      return data.slice(0, 4); // For now just take first 4, or filter by isFeatured if implemented
    },
  });
}

export function usePackage(id: string) {
  return useQuery({
    queryKey: ['cms-package', id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/packages/${id}`);
      if (!response.ok) throw new Error('Failed to fetch package');
      return response.json() as Promise<CMSPackage>;
    },
    enabled: !!id,
  });
}

export function useHotels() {
  return useQuery({
    queryKey: ['cms-hotels'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/hotels`);
      if (!response.ok) throw new Error('Failed to fetch hotels');
      return response.json() as Promise<CMSHotel[]>;
    },
  });
}

export function useCabs() {
  return useQuery({
    queryKey: ['cms-cabs'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/cabs`);
      if (!response.ok) throw new Error('Failed to fetch cabs');
      return response.json() as Promise<CMSCab[]>;
    },
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ['cms-testimonials'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/testimonials`);
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      return response.json() as Promise<CMSTestimonial[]>;
    },
  });
}

export function useDestinations() {
  return useQuery({
    queryKey: ['cms-destinations'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/packages`);
      if (!response.ok) throw new Error('Failed to fetch destinations');
      const data = await response.json() as CMSPackage[];
      const uniqueDestinations = [...new Set(data.map(p => p.destination))];
      return uniqueDestinations;
    },
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ['cms-locations'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/hotels`);
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json() as CMSHotel[];
      const uniqueLocations = [...new Set(data.map(h => h.location))];
      return uniqueLocations;
    },
  });
}

export interface CMSFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export function useFAQs() {
  return useQuery({
    queryKey: ['cms-faqs'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/faqs`);
      if (!response.ok) throw new Error('Failed to fetch faqs');
      return response.json() as Promise<CMSFAQ[]>;
    },
  });
}
