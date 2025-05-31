
import { supabase } from '@/integrations/supabase/client';

export interface AmazonRevenueData {
  id?: string;
  month: string;
  fatturato: number;
  created_at?: string;
  updated_at?: string;
}

// Save or update Amazon revenue for a specific month
export const saveAmazonRevenue = async (
  month: string,
  fatturato: number
): Promise<AmazonRevenueData> => {
  console.log('Saving Amazon revenue:', { month, fatturato });
  
  const { data, error } = await supabase
    .from('amazon_revenue')
    .upsert({
      month,
      fatturato
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving Amazon revenue:', error);
    throw error;
  }

  console.log('Amazon revenue saved:', data);
  return data;
};

// Get all Amazon revenue records
export const getAllAmazonRevenue = async (): Promise<AmazonRevenueData[]> => {
  console.log('Fetching all Amazon revenue');
  
  const { data, error } = await supabase
    .from('amazon_revenue')
    .select('*')
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching Amazon revenue:', error);
    throw error;
  }

  console.log('Amazon revenue fetched:', data);
  return data || [];
};

// Delete Amazon revenue record
export const deleteAmazonRevenue = async (id: string): Promise<void> => {
  console.log('Deleting Amazon revenue:', id);
  
  const { error } = await supabase
    .from('amazon_revenue')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting Amazon revenue:', error);
    throw error;
  }

  console.log('Amazon revenue deleted successfully');
};
