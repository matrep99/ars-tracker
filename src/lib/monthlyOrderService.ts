
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyOrderData {
  id?: string;
  month: string;
  prodotto: string;
  pezzi_totali: number;
  importo_totale_iva_inclusa: number;
  iva: number;
  imponibile_totale: number;
  is_amazon: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CSVRow {
  prodotto: string;
  pezzi_totali: number;
  importo_totale_iva_inclusa: number;
  iva: number;
  imponibile_totale: number;
}

// Save monthly order data from CSV
export const saveMonthlyOrderData = async (
  orderData: Omit<MonthlyOrderData, 'id' | 'created_at' | 'updated_at'>[]
): Promise<MonthlyOrderData[]> => {
  console.log('Saving monthly order data to Supabase:', orderData);
  
  const { data, error } = await supabase
    .from('monthly_orders')
    .insert(orderData)
    .select();

  if (error) {
    console.error('Error saving monthly order data:', error);
    throw error;
  }

  console.log('Monthly order data saved:', data);
  return data || [];
};

// Get monthly orders by date range
export const getMonthlyOrdersByDateRange = async (
  startDate: string,
  endDate: string
): Promise<MonthlyOrderData[]> => {
  console.log('Fetching monthly orders by date range:', { startDate, endDate });
  
  const { data, error } = await supabase
    .from('monthly_orders')
    .select('*')
    .gte('month', startDate)
    .lte('month', endDate)
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching monthly orders:', error);
    throw error;
  }

  console.log('Monthly orders fetched:', data);
  return data || [];
};

// Get all monthly orders
export const getAllMonthlyOrders = async (): Promise<MonthlyOrderData[]> => {
  console.log('Fetching all monthly orders');
  
  const { data, error } = await supabase
    .from('monthly_orders')
    .select('*')
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching monthly orders:', error);
    throw error;
  }

  console.log('All monthly orders fetched:', data);
  return data || [];
};

// Delete monthly order
export const deleteMonthlyOrder = async (id: string): Promise<void> => {
  console.log('Deleting monthly order:', id);
  
  const { error } = await supabase
    .from('monthly_orders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting monthly order:', error);
    throw error;
  }

  console.log('Monthly order deleted successfully');
};

// Parse CSV content
export const parseCSVContent = (csvContent: string): CSVRow[] => {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const expectedHeaders = ['prodotto', 'pezzi totali', 'importo totale', 'iva', 'imponibile totale'];
  
  // Map CSV headers to our field names
  const headerMap: { [key: string]: string } = {
    'prodotto': 'prodotto',
    'pezzi totali': 'pezzi_totali',
    'importo totale': 'importo_totale_iva_inclusa',
    'iva': 'iva',
    'imponibile totale': 'imponibile_totale'
  };
  
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue;
    
    const row: any = {};
    headers.forEach((header, index) => {
      const fieldName = headerMap[header];
      if (fieldName) {
        if (fieldName === 'prodotto') {
          row[fieldName] = values[index];
        } else {
          row[fieldName] = parseFloat(values[index]) || 0;
        }
      }
    });
    
    if (row.prodotto) {
      rows.push(row as CSVRow);
    }
  }
  
  return rows;
};
