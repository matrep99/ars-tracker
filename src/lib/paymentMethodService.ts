
import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethodData {
  id?: string;
  month: string;
  payment_method: string;
  orders_count: number;
  created_at?: string;
  updated_at?: string;
}

export const savePaymentMethodData = async (data: Omit<PaymentMethodData, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentMethodData> => {
  console.log('Saving payment method data:', data);
  
  const { data: savedData, error } = await supabase
    .from('payment_methods')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error saving payment method data:', error);
    throw error;
  }

  console.log('Payment method data saved:', savedData);
  return savedData;
};

export const getAllPaymentMethods = async (): Promise<PaymentMethodData[]> => {
  console.log('Fetching all payment methods');
  
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }

  console.log('Payment methods fetched:', data);
  return data || [];
};

export const getPaymentMethodsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<PaymentMethodData[]> => {
  console.log('Fetching payment methods by date range:', { startDate, endDate });
  
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .gte('month', startDate)
    .lte('month', endDate)
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching payment methods by date range:', error);
    throw error;
  }

  console.log('Payment methods by date range fetched:', data);
  return data || [];
};

export const updatePaymentMethodData = async (
  id: string,
  updates: Partial<Omit<PaymentMethodData, 'id' | 'created_at' | 'updated_at'>>
): Promise<PaymentMethodData> => {
  console.log('Updating payment method data:', { id, updates });
  
  const { data, error } = await supabase
    .from('payment_methods')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment method data:', error);
    throw error;
  }

  console.log('Payment method data updated:', data);
  return data;
};

export const deletePaymentMethodData = async (id: string): Promise<void> => {
  console.log('Deleting payment method data:', id);
  
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting payment method data:', error);
    throw error;
  }

  console.log('Payment method data deleted successfully');
};
