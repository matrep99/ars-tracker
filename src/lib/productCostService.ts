
import { supabase } from '@/integrations/supabase/client';

export interface ProductCostData {
  id?: string;
  prodotto: string;
  production_cost: number;
  packaging_cost: number;
  has_shipping_cost: boolean;
  created_at?: string;
  updated_at?: string;
}

// Save or update product costs
export const saveProductCosts = async (
  productCosts: Omit<ProductCostData, 'id' | 'created_at' | 'updated_at'>[]
): Promise<ProductCostData[]> => {
  console.log('Saving product costs to Supabase:', productCosts);
  
  const { data, error } = await supabase
    .from('product_costs')
    .upsert(productCosts, { onConflict: 'prodotto' })
    .select();

  if (error) {
    console.error('Error saving product costs:', error);
    throw error;
  }

  console.log('Product costs saved:', data);
  return data || [];
};

// Get all product costs
export const getAllProductCosts = async (): Promise<ProductCostData[]> => {
  console.log('Fetching all product costs');
  
  const { data, error } = await supabase
    .from('product_costs')
    .select('*')
    .order('prodotto');

  if (error) {
    console.error('Error fetching product costs:', error);
    throw error;
  }

  console.log('Product costs fetched:', data);
  return data || [];
};

// Get product cost by name
export const getProductCostByName = async (prodotto: string): Promise<ProductCostData | null> => {
  console.log('Fetching product cost for:', prodotto);
  
  const { data, error } = await supabase
    .from('product_costs')
    .select('*')
    .eq('prodotto', prodotto)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product cost:', error);
    throw error;
  }

  console.log('Product cost fetched:', data);
  return data;
};

// Delete product cost
export const deleteProductCost = async (id: string): Promise<void> => {
  console.log('Deleting product cost:', id);
  
  const { error } = await supabase
    .from('product_costs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product cost:', error);
    throw error;
  }

  console.log('Product cost deleted successfully');
};
