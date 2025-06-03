import { supabase } from './supabase';

export async function addToPica(email: string) {
  try {
    const { data, error } = await supabase.functions.invoke('subscribe-email', {
      body: { email }
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error adding to Pica:', error);
    throw new Error(error.message || 'Failed to subscribe to waitlist');
  }
}