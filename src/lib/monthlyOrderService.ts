
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

// Improved CSV parser with better error handling
export const parseCSVContent = (csvContent: string): CSVRow[] => {
  console.log('Parsing CSV content:', csvContent.substring(0, 200) + '...');
  
  const lines = csvContent.trim().split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  console.log('CSV Headers found:', headers);
  
  // More flexible header mapping
  const headerMap: { [key: string]: string } = {};
  
  headers.forEach((header, index) => {
    const cleanHeader = header.toLowerCase().trim();
    if (cleanHeader.includes('prodotto') || cleanHeader.includes('product')) {
      headerMap['prodotto'] = index.toString();
    } else if (cleanHeader.includes('pezzi') || cleanHeader.includes('totali') || cleanHeader.includes('quantity')) {
      headerMap['pezzi_totali'] = index.toString();
    } else if (cleanHeader.includes('importo') || cleanHeader.includes('totale') && !cleanHeader.includes('imponibile')) {
      headerMap['importo_totale_iva_inclusa'] = index.toString();
    } else if (cleanHeader.includes('iva') || cleanHeader.includes('tax')) {
      headerMap['iva'] = index.toString();
    } else if (cleanHeader.includes('imponibile') || cleanHeader.includes('net')) {
      headerMap['imponibile_totale'] = index.toString();
    }
  });
  
  console.log('Header mapping:', headerMap);
  
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    // Handle CSV values that might contain commas within quotes
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length < Math.max(...Object.values(headerMap).map(v => parseInt(v))) + 1) {
      console.warn(`Skipping row ${i} due to insufficient columns:`, values);
      continue;
    }
    
    try {
      const row: CSVRow = {
        prodotto: values[parseInt(headerMap['prodotto'])] || '',
        pezzi_totali: parseFloat(values[parseInt(headerMap['pezzi_totali'])] || '0') || 0,
        importo_totale_iva_inclusa: parseFloat(values[parseInt(headerMap['importo_totale_iva_inclusa'])] || '0') || 0,
        iva: parseFloat(values[parseInt(headerMap['iva'])] || '0') || 0,
        imponibile_totale: parseFloat(values[parseInt(headerMap['imponibile_totale'])] || '0') || 0
      };
      
      // Only add rows with valid product names
      if (row.prodotto && row.prodotto.trim() !== '') {
        rows.push(row);
        console.log(`Parsed row ${i}:`, row);
      } else {
        console.warn(`Skipping row ${i} due to missing product name:`, values);
      }
    } catch (error) {
      console.error(`Error parsing row ${i}:`, values, error);
    }
  }
  
  console.log(`Successfully parsed ${rows.length} rows from ${lines.length - 1} total rows`);
  return rows;
};
