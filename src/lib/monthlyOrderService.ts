
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
  total_orders?: number;
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

// Delete all monthly orders for a specific month
export const deleteMonthlyOrdersByMonth = async (month: string): Promise<void> => {
  console.log('Deleting monthly orders for month:', month);
  
  const { error } = await supabase
    .from('monthly_orders')
    .delete()
    .eq('month', month);

  if (error) {
    console.error('Error deleting monthly orders:', error);
    throw error;
  }

  console.log('Monthly orders deleted successfully for month:', month);
};

// Enhanced numeric value parser with better error handling
const parseNumericValue = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  // Convert to string and clean
  let cleanValue = value.toString().trim();
  
  // Remove currency symbols and common formatting
  cleanValue = cleanValue
    .replace(/[€$£¥₹]/g, '') // Remove currency symbols
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[()]/g, '') // Remove parentheses
    .replace(/"/g, '') // Remove quotes
    .trim();
  
  // Handle percentage values
  if (cleanValue.includes('%')) {
    cleanValue = cleanValue.replace('%', '');
    const percentValue = parseFloat(cleanValue.replace(',', '.'));
    return isNaN(percentValue) ? 0 : percentValue;
  }
  
  // Handle thousand separators and decimal points
  // Replace comma with dot for decimal separator if it's the last comma/dot
  const lastCommaIndex = cleanValue.lastIndexOf(',');
  const lastDotIndex = cleanValue.lastIndexOf('.');
  
  if (lastCommaIndex > lastDotIndex && lastCommaIndex > cleanValue.length - 4) {
    // Last comma is likely decimal separator
    cleanValue = cleanValue.substring(0, lastCommaIndex) + '.' + cleanValue.substring(lastCommaIndex + 1);
    cleanValue = cleanValue.replace(/,/g, ''); // Remove other commas
  } else if (lastDotIndex > lastCommaIndex && lastDotIndex > cleanValue.length - 4) {
    // Last dot is likely decimal separator, remove commas
    cleanValue = cleanValue.replace(/,/g, '');
  } else {
    // No clear decimal separator, remove all
    cleanValue = cleanValue.replace(/[.,]/g, '');
  }
  
  const num = parseFloat(cleanValue);
  return isNaN(num) ? 0 : num;
};

// Enhanced CSV parser with better error handling and validation
export const parseCSVContent = (csvContent: string): CSVRow[] => {
  console.log('Parsing CSV content:', csvContent.substring(0, 500) + '...');
  
  const lines = csvContent.trim().split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  // Parse headers with more flexible matching
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["\s]/g, ''));
  console.log('CSV Headers found:', headers);
  
  // Enhanced header mapping with more variations
  const headerMap: { [key: string]: number } = {};
  
  headers.forEach((header, index) => {
    const cleanHeader = header.toLowerCase().trim();
    
    if (cleanHeader.includes('prodotto') || cleanHeader.includes('product') || cleanHeader.includes('nome') || cleanHeader.includes('item')) {
      headerMap['prodotto'] = index;
    } else if (cleanHeader.includes('pezzi') || cleanHeader.includes('totali') || cleanHeader.includes('quantity') || cleanHeader.includes('quantità') || cleanHeader.includes('qty')) {
      headerMap['pezzi_totali'] = index;
    } else if ((cleanHeader.includes('importo') && (cleanHeader.includes('totale') || cleanHeader.includes('total'))) || 
               cleanHeader.includes('totalamount') || cleanHeader.includes('gross') || cleanHeader.includes('lordo')) {
      headerMap['importo_totale_iva_inclusa'] = index;
    } else if (cleanHeader.includes('iva') || cleanHeader.includes('tax') || cleanHeader.includes('vat') || cleanHeader.includes('imposta')) {
      headerMap['iva'] = index;
    } else if (cleanHeader.includes('imponibile') || cleanHeader.includes('net') || cleanHeader.includes('netto') || cleanHeader.includes('taxable')) {
      headerMap['imponibile_totale'] = index;
    }
  });
  
  console.log('Header mapping:', headerMap);
  
  // Validate required headers
  const requiredFields = ['prodotto', 'pezzi_totali', 'importo_totale_iva_inclusa'];
  const missingFields = requiredFields.filter(field => headerMap[field] === undefined);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required columns: ${missingFields.join(', ')}`);
  }
  
  const rows: CSVRow[] = [];
  const errors: string[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      // Enhanced CSV parsing to handle quoted values
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      let quoteChar = '';
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if ((char === '"' || char === "'") && !inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
          inQuotes = false;
          quoteChar = '';
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      
      if (values.length < Math.max(...Object.values(headerMap)) + 1) {
        errors.push(`Row ${i}: Insufficient columns (${values.length} found, need ${Math.max(...Object.values(headerMap)) + 1})`);
        console.warn(`Skipping row ${i} due to insufficient columns:`, values);
        continue;
      }
      
      const prodotto = values[headerMap['prodotto']] || '';
      const pezzi_totali = parseNumericValue(values[headerMap['pezzi_totali']] || '0');
      const importo_totale_iva_inclusa = parseNumericValue(values[headerMap['importo_totale_iva_inclusa']] || '0');
      
      // Enhanced IVA handling
      let iva = 0;
      let imponibile_totale = 0;
      
      if (headerMap['iva'] !== undefined) {
        const ivaValue = values[headerMap['iva']] || '0';
        iva = parseNumericValue(ivaValue);
        
        // If IVA is a percentage, calculate absolute value
        if (ivaValue.includes('%') || (iva > 0 && iva <= 100 && importo_totale_iva_inclusa > iva)) {
          iva = (importo_totale_iva_inclusa * iva) / (100 + iva);
        }
      }
      
      // Calculate or parse imponibile
      if (headerMap['imponibile_totale'] !== undefined) {
        imponibile_totale = parseNumericValue(values[headerMap['imponibile_totale']] || '0');
      } else {
        imponibile_totale = importo_totale_iva_inclusa - iva;
      }
      
      // Validate data quality
      if (prodotto && prodotto.trim() !== '' && importo_totale_iva_inclusa > 0 && pezzi_totali > 0) {
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
        const reason = !prodotto ? 'No product name' : 
                     importo_totale_iva_inclusa <= 0 ? 'Invalid amount' :
                     pezzi_totali <= 0 ? 'Invalid quantity' : 'Unknown reason';
        errors.push(`Row ${i}: Invalid data - ${reason}`);
        console.warn(`Skipping row ${i} due to invalid data (${reason}):`, values);
      }
    } catch (error) {
      const errorMsg = `Row ${i}: ${error instanceof Error ? error.message : 'Parse error'}`;
      errors.push(errorMsg);
      console.error(`Error parsing row ${i}:`, error, line);
    }
  }
  
  console.log(`Successfully parsed ${rows.length} rows from ${lines.length - 1} total rows`);
  if (errors.length > 0) {
    console.warn('Parse errors encountered:', errors);
  }
  
  if (rows.length === 0) {
    throw new Error('No valid data rows found in CSV. Please check the format and try again.');
  }
  
  return rows;
};
