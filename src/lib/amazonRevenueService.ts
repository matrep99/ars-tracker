
import { supabase } from '@/integrations/supabase/client';

export interface AmazonRevenueData {
  id?: string;
  month: string;
  fatturato: number;
  spesa_ads: number;
  roi: number;
  created_at?: string;
  updated_at?: string;
  amazon_products?: AmazonProductData[];
}

export interface AmazonProductData {
  id?: string;
  amazon_revenue_id: string;
  nome: string;
  quantita: number;
  fatturato_prodotto?: number;
  created_at?: string;
}

// Save or update Amazon revenue for a specific month with products
export const saveAmazonRevenue = async (
  month: string,
  fatturato: number,
  spesa_ads: number,
  products: { nome: string; quantita: number; fatturato_prodotto?: number }[] = []
): Promise<AmazonRevenueData> => {
  console.log('Saving Amazon revenue:', { month, fatturato, spesa_ads, products });
  
  // Calculate ROI
  const roi = spesa_ads > 0 ? ((fatturato - spesa_ads) / spesa_ads) * 100 : 0;
  
  const { data: amazonRevenue, error } = await supabase
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

  // Delete existing products for this revenue record
  await supabase
    .from('amazon_products')
    .delete()
    .eq('amazon_revenue_id', amazonRevenue.id);

  // Insert new products if any
  if (products.length > 0) {
    const productsToInsert = products.map(product => ({
      amazon_revenue_id: amazonRevenue.id,
      nome: product.nome,
      quantita: product.quantita,
      fatturato_prodotto: product.fatturato_prodotto || 0
    }));

    const { data: savedProducts, error: productsError } = await supabase
      .from('amazon_products')
      .insert(productsToInsert)
      .select();

    if (productsError) {
      console.error('Error saving Amazon products:', productsError);
      throw productsError;
    }

    console.log('Amazon revenue and products saved:', { amazonRevenue, savedProducts });
    return { ...amazonRevenue, amazon_products: savedProducts };
  }

  console.log('Amazon revenue saved:', amazonRevenue);
  return { ...amazonRevenue, amazon_products: [] };
};

// Get all Amazon revenue records with products
export const getAllAmazonRevenue = async (): Promise<AmazonRevenueData[]> => {
  console.log('Fetching all Amazon revenue with products');
  
  const { data, error } = await supabase
    .from('amazon_revenue')
    .select(`
      *,
      amazon_products (*)
    `)
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching Amazon revenue:', error);
    throw error;
  }

  console.log('Amazon revenue with products fetched:', data);
  return data || [];
};

// Get Amazon revenue filtered by date range with products
export const getAmazonRevenueByDateRange = async (
  startDate: string,
  endDate: string
): Promise<AmazonRevenueData[]> => {
  console.log('Fetching Amazon revenue by date range with products:', { startDate, endDate });
  
  const { data, error } = await supabase
    .from('amazon_revenue')
    .select(`
      *,
      amazon_products (*)
    `)
    .gte('month', startDate)
    .lte('month', endDate)
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching Amazon revenue by date range:', error);
    throw error;
  }

  console.log('Amazon revenue by date range with products fetched:', data);
  return data || [];
};

// Delete Amazon revenue record (products will be deleted automatically due to CASCADE)
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
