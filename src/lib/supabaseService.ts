
import { supabase } from '@/integrations/supabase/client';

export interface CampaignData {
  id?: string;
  titolo: string;
  descrizione: string;
  budget: number;
  fatturato: number;
  ordini: number;
  prodotti: number;
  data: string;
  roi: number;
  valore_medio_ordine: number;
  prodotti_medi_per_ordine: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductData {
  id?: string;
  campaign_id: string;
  nome: string;
  quantita: number;
  created_at?: string;
}

export interface CampaignWithProducts extends CampaignData {
  campaign_products: ProductData[];
}

// Save a new campaign with its products
export const saveCampaignToSupabase = async (
  campaignData: Omit<CampaignData, 'id' | 'created_at' | 'updated_at'>,
  products: { nome: string; quantita: number }[]
): Promise<CampaignWithProducts> => {
  console.log('Saving campaign to Supabase:', campaignData);
  
  // Insert campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert([campaignData])
    .select()
    .single();

  if (campaignError) {
    console.error('Error saving campaign:', campaignError);
    throw campaignError;
  }

  console.log('Campaign saved:', campaign);

  // Insert products
  if (products.length > 0) {
    const productsToInsert = products.map(product => ({
      campaign_id: campaign.id,
      nome: product.nome,
      quantita: product.quantita
    }));

    const { data: savedProducts, error: productsError } = await supabase
      .from('campaign_products')
      .insert(productsToInsert)
      .select();

    if (productsError) {
      console.error('Error saving products:', productsError);
      throw productsError;
    }

    console.log('Products saved:', savedProducts);
    return { ...campaign, campaign_products: savedProducts };
  }

  return { ...campaign, campaign_products: [] };
};

// Get all campaigns with their products
export const getAllCampaignsFromSupabase = async (): Promise<CampaignWithProducts[]> => {
  console.log('Fetching all campaigns from Supabase');
  
  const { data: campaigns, error: campaignError } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_products (*)
    `)
    .order('created_at', { ascending: false });

  if (campaignError) {
    console.error('Error fetching campaigns:', campaignError);
    throw campaignError;
  }

  console.log('Campaigns fetched:', campaigns);
  return campaigns || [];
};

// Delete a campaign (products will be deleted automatically due to CASCADE)
export const deleteCampaignFromSupabase = async (campaignId: string): Promise<void> => {
  console.log('Deleting campaign from Supabase:', campaignId);
  
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId);

  if (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }

  console.log('Campaign deleted successfully');
};

// Get campaign by ID (for shared links)
export const getCampaignById = async (campaignId: string): Promise<CampaignWithProducts | null> => {
  console.log('Fetching campaign by ID from Supabase:', campaignId);
  
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_products (*)
    `)
    .eq('id', campaignId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching campaign:', error);
    throw error;
  }

  console.log('Campaign fetched:', campaign);
  return campaign;
};
