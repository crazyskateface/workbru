import { supabase } from './supabase';
import { Workspace } from '../types';

// Get all workspaces
export async function getAllWorkspaces() {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Workspace[];
}

// Get a single workspace by ID
export async function getWorkspaceById(id: string) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Workspace;
}

// Create a new workspace
export async function createWorkspace(workspace: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('workspaces')
    .insert([workspace])
    .select()
    .single();

  if (error) throw error;
  return data as Workspace;
}

// Update a workspace
export async function updateWorkspace(id: string, updates: Partial<Workspace>) {
  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Workspace;
}

// Delete a workspace
export async function deleteWorkspace(id: string) {
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Get nearby workspaces within a radius (in kilometers)
export async function getNearbyWorkspaces(
  latitude: number,
  longitude: number,
  radiusKm: number = 5
) {
  // Using PostGIS to calculate distance and filter
  const { data, error } = await supabase
    .rpc('get_nearby_workspaces', {
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm
    });

  if (error) throw error;
  return data as Workspace[];
}