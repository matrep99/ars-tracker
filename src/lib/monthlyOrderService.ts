
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

// Helper function to clean and parse numeric values
const parseNumericValue = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  // Remove currency symbols, spaces, and convert to string
  let cleanValue = value.toString().trim();
  
  // Remove common currency symbols and formatting
  cleanValue = cleanValue
    .replace(/[€$£¥₹]/g, '') // Remove currency symbols
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[()]/g, '') // Remove parentheses
    .trim();
  
  // Handle percentage values (convert to decimal)
  if (cleanValue.includes('%')) {
    cleanValue = cleanValue.replace('%', '');
    const percentValue = parseFloat(cleanValue.replace(',', '.'));
    return isNaN(percentValue) ? 0 : percentValue;
  }
  
  // Handle thousand separators and decimal points
  // If there are multiple dots or commas, assume the last one is decimal
  const parts = cleanValue.split(/[.,]/);
  
  if (parts.length === 1) {
    // No decimal separator
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  } else if (parts.length === 2) {
    // One separator - could be thousand or decimal
    const lastPart = parts[1];
    if (lastPart.length <= 2) {
      // Likely decimal separator
      const num = parseFloat(cleanValue.replace(',', '.'));
      return isNaN(num) ? 0 : num;
    } else {
      // Likely thousand separator
      const num = parseFloat(parts.join(''));
      return isNaN(num) ? 0 : num;
    }
  } else {
    // Multiple separators - last one is decimal, others are thousand
    const decimalPart = parts.pop() || '0';
    const integerPart = parts.join('');
    const num = parseFloat(`${integerPart}.${decimalPart}`);
    return isNaN(num) ? 0 : num;
  }
};

// Improved CSV parser with better error handling
export const parseCSVContent = (csvContent: string): CSVRow[] => {
  console.log('Parsing CSV content:', csvContent.substring(0, 500) + '...');
  
  const lines = csvContent.trim().split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  // Parse headers with more flexible matching
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  console.log('CSV Headers found:', headers);
  
  // More flexible header mapping
  const headerMap: { [key: string]: number } = {};
  
  headers.forEach((header, index) => {
    const cleanHeader = header.toLowerCase().trim();
    
    if (cleanHeader.includes('prodotto') || cleanHeader.includes('product') || cleanHeader.includes('nome')) {
      headerMap['prodotto'] = index;
    } else if (cleanHeader.includes('pezzi') || cleanHeader.includes('totali') || cleanHeader.includes('quantity') || cleanHeader.includes('quantità')) {
      headerMap['pezzi_totali'] = index;
    } else if ((cleanHeader.includes('importo') && cleanHeader.includes('totale')) || 
               (cleanHeader.includes('total') && !cleanHeader.includes('imponibile')) ||
               cleanHeader.includes('gross')) {
      headerMap['importo_totale_iva_inclusa'] = index;
    } else if (cleanHeader.includes('iva') || cleanHeader.includes('tax') || cleanHeader.includes('vat')) {
      headerMap['iva'] = index;
    } else if (cleanHeader.includes('imponibile') || cleanHeader.includes('net') || cleanHeader.includes('netto')) {
      headerMap['imponibile_totale'] = index;
    }
  });
  
  console.log('Header mapping:', headerMap);
  
  // Validate that we have required headers
  const requiredFields = ['prodotto', 'pezzi_totali', 'importo_totale_iva_inclusa'];
  const missingFields = requiredFields.filter(field => headerMap[field] === undefined);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required columns: ${missingFields.join(', ')}`);
  }
  
  const rows: CSVRow[] = [];
  const errors: string[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    try {
      // Handle CSV values that might contain commas within quotes
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim()); // Add the last value
      
      if (values.length < Math.max(...Object.values(headerMap)) + 1) {
        errors.push(`Row ${i}: Insufficient columns`);
        console.warn(`Skipping row ${i} due to insufficient columns:`, values);
        continue;
      }
      
      const prodotto = values[headerMap['prodotto']] || '';
      const pezzi_totali = parseNumericValue(values[headerMap['pezzi_totali']] || '0');
      const importo_totale_iva_inclusa = parseNumericValue(values[headerMap['importo_totale_iva_inclusa']] || '0');
      
      // Handle IVA - could be absolute value or percentage
      let iva = 0;
      if (headerMap['iva'] !== undefined) {
        const ivaValue = values[headerMap['iva']] || '0';
        iva = parseNumericValue(ivaValue);
        
        // If IVA looks like a percentage (< 1 or contains %), convert to absolute value
        if (ivaValue.includes('%') || iva < 1) {
          iva = (importo_totale_iva_inclusa * iva) / 100;
        }
      }
      
      // Calculate imponibile if not provided
      let imponibile_totale = 0;
      if (headerMap['imponibile_totale'] !== undefined) {
        imponibile_totale = parseNumericValue(values[headerMap['imponibile_totale']] || '0');
      } else {
        // Calculate from importo_totale - iva
        imponibile_totale = importo_totale_iva_inclusa - iva;
      }
      
      // Only add rows with valid product names and positive values
      if (prodotto && prodotto.trim() !== '' && importo_totale_iva_inclusa > 0) {
        const row: CSVRow = {
          prodotto: prodotto.trim(),
          pezzi_totali,
          importo_totale_iva_inclusa,
          iva,
          imponibile_totale
        };
        
        rows.push(row);
        console.log(`Successfully parsed row ${i}:`, row);
      } else {
        errors.push(`Row ${i}: Invalid data - ${prodotto || 'No product name'}`);
        console.warn(`Skipping row ${i} due to invalid data:`, values);
      }
    } catch (error) {
      const errorMsg = `Row ${i}: ${error instanceof Error ? error.message : 'Parse error'}`;
      errors.push(errorMsg);
      console.error(`Error parsing row ${i}:`, error);
    }
  }
  
  console.log(`Successfully parsed ${rows.length} rows from ${lines.length - 1} total rows`);
  if (errors.length > 0) {
    console.warn('Parse errors encountered:', errors);
  }
  
  if (rows.length === 0) {
    throw new Error('No valid data rows found in CSV');
  }
  
  return rows;
};
