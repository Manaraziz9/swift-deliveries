import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SavedLocation {
  id: string;
  user_id: string;
  label: string;
  address_text: string | null;
  address_text_ar: string | null;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  icon: string | null;
}

export function useUserLocations() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultLocation, setDefaultLoc] = useState<SavedLocation | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!user) { setLocations([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    if (!error && data) {
      setLocations(data as SavedLocation[]);
      setDefaultLoc((data as SavedLocation[]).find(l => l.is_default) || null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const addLocation = useCallback(async (loc: Omit<SavedLocation, 'id' | 'user_id'>) => {
    if (!user) return;
    const { error } = await supabase.from('user_locations').insert({
      user_id: user.id,
      label: loc.label,
      address_text: loc.address_text,
      address_text_ar: loc.address_text_ar,
      lat: loc.lat,
      lng: loc.lng,
      is_default: loc.is_default,
      icon: loc.icon,
    });
    if (!error) await fetchLocations();
    return !error;
  }, [user, fetchLocations]);

  const updateLocation = useCallback(async (id: string, updates: Partial<SavedLocation>) => {
    const { error } = await supabase.from('user_locations').update(updates).eq('id', id);
    if (!error) await fetchLocations();
    return !error;
  }, [fetchLocations]);

  const deleteLocation = useCallback(async (id: string) => {
    const { error } = await supabase.from('user_locations').delete().eq('id', id);
    if (!error) await fetchLocations();
    return !error;
  }, [fetchLocations]);

  const setDefault = useCallback(async (id: string) => {
    return updateLocation(id, { is_default: true });
  }, [updateLocation]);

  return { locations, loading, defaultLocation, addLocation, updateLocation, deleteLocation, setDefault, refetch: fetchLocations };
}
