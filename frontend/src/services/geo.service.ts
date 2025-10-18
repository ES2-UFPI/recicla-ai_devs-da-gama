import api from './api';

interface NominatimAddress {
  road?: string;
  footway?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  postcode?: string;
  house_number?: string;
  state?: string;
  city?: string;
  town?: string;
  village?: string;
}

export interface ReverseResult {
  lat: number;
  lon: number;
  address?: NominatimAddress;
  display_name?: string;
}

export interface SearchResultItem {
  lat: string;
  lon: string;
  display_name: string;
}

export const geoService = {
  async reverse(lat: number, lon: number): Promise<ReverseResult> {
    const resp = await api.get('/geo/reverse', { params: { lat, lon } });
    return resp.data;
  },
  async search(q: string): Promise<SearchResultItem[]> {
    const resp = await api.get('/geo/search', { params: { q } });
    return Array.isArray(resp.data) ? resp.data : [];
  },
};
