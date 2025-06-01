
import { supabase } from '@/integrations/supabase/client';

export interface AmazonRevenueData {
  id?: string;
  month: string;
  fatturato: number;
  spesa_ads: number;
  roi: number;
  created_at?: string;
  updated_at?: string;
}

// Save or update Amazon revenue for a specific month
export const saveAmazonRevenue = async (
  month: string,
  fatturato: number,
  spesa_ads: number
): Promise<AmazonRevenueData> => {
  console.log('Saving Amazon revenue:', { month, fatturato, spesa_ads });
  
  // Calculate ROI
  const roi = spesa_ads > 0 ? ((fatturato - spesa_ads) / spesa_ads) * 100 : 0;
  
  const { data, error } = await supabase
    .from('amazon_revenue')
    .upsert({
      month,
      fatturato,
      spesa_ads,
      roi
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

// Get Amazon revenue filtered by date range
export const getAmazonRevenueByDateRange = async (
  startDate: string,
  endDate: string
): Promise<AmazonRevenueData[]> => {
  console.log('Fetching Amazon revenue by date range:', { startDate, endDate });
  
  const { data, error } = await supabase
    .from('amazon_revenue')
    .select('*')
    .gte('month', startDate)
    .lte('month', endDate)
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching Amazon revenue by date range:', error);
    throw error;
  }

  console.log('Amazon revenue by date range fetched:', data);
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
