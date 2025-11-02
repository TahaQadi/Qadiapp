/**
 * Utility functions for CSV import functionality
 */

export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  data: any[];
  errors: ImportValidationError[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface ClientImportData {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  isAdmin?: boolean;
  departmentTypes?: string[];
  locationName?: string;
  locationAddress?: string;
  locationCity?: string;
  locationCountry?: string;
}

/**
 * Parses a CSV file and returns the data
 * @param file - CSV file to parse
 * @returns Promise with parsed data
 */
export function parseCSVFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        const data = lines.map(line => {
          // Simple CSV parsing - handles quoted fields
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
              } else {
                // Toggle quote state
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          
          result.push(current.trim());
          return result;
        });
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Validates CSV headers against expected format
 * @param headers - CSV headers
 * @returns Array of missing required headers
 */
export function validateCSVHeaders(headers: string[]): string[] {
  const requiredHeaders = ['username', 'password', 'name'];
  const missingHeaders: string[] = [];
  
  for (const required of requiredHeaders) {
    if (!headers.some(header => header.toLowerCase().trim() === required.toLowerCase())) {
      missingHeaders.push(required);
    }
  }
  
  return missingHeaders;
}

/**
 * Validates a single row of client data
 * @param row - Row data
 * @param headers - CSV headers
 * @param rowIndex - Row index for error reporting
 * @returns Array of validation errors
 */
export function validateClientRow(row: string[], headers: string[], rowIndex: number): ImportValidationError[] {
  const errors: ImportValidationError[] = [];
  
  // Create a map of header to value
  const data: Record<string, string> = {};
  headers.forEach((header, index) => {
    data[header.toLowerCase().trim()] = row[index]?.trim() || '';
  });
  
  // Required field validation
  if (!data.username) {
    errors.push({
      row: rowIndex,
      field: 'username',
      message: 'Username is required'
    });
  } else if (data.username.length < 3) {
    errors.push({
      row: rowIndex,
      field: 'username',
      message: 'Username must be at least 3 characters'
    });
  }
  
  if (!data.password) {
    errors.push({
      row: rowIndex,
      field: 'password',
      message: 'Password is required'
    });
  } else if (data.password.length < 6) {
    errors.push({
      row: rowIndex,
      field: 'password',
      message: 'Password must be at least 6 characters'
    });
  }
  
  if (!data.name) {
    errors.push({
      row: rowIndex,
      field: 'name',
      message: 'Name is required'
    });
  }
  
  // Email validation (if provided)
  if (data.email && data.email.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push({
        row: rowIndex,
        field: 'email',
        message: 'Invalid email format'
      });
    }
  }
  
  // Boolean validation for isAdmin
  if (data.isadmin && data.isadmin.length > 0) {
    const validValues = ['true', 'false', 'yes', 'no', '1', '0'];
    if (!validValues.includes(data.isadmin.toLowerCase())) {
      errors.push({
        row: rowIndex,
        field: 'isAdmin',
        message: 'isAdmin must be true/false, yes/no, or 1/0'
      });
    }
  }
  
  return errors;
}

/**
 * Processes CSV data and validates it
 * @param csvData - Parsed CSV data
 * @returns Import result with validation
 */
export function processCSVData(csvData: string[][]): ImportResult {
  if (csvData.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{
        row: 0,
        field: 'file',
        message: 'CSV file is empty'
      }],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0
    };
  }
  
  const headers = csvData[0];
  const dataRows = csvData.slice(1);
  
  // Validate headers
  const missingHeaders = validateCSVHeaders(headers);
  if (missingHeaders.length > 0) {
    return {
      success: false,
      data: [],
      errors: [{
        row: 0,
        field: 'headers',
        message: `Missing required headers: ${missingHeaders.join(', ')}`
      }],
      totalRows: dataRows.length,
      validRows: 0,
      invalidRows: dataRows.length
    };
  }
  
  const errors: ImportValidationError[] = [];
  const validData: ClientImportData[] = [];
  
  // Validate each row
  dataRows.forEach((row, index) => {
    const rowErrors = validateClientRow(row, headers, index + 2); // +2 because header is row 1
    errors.push(...rowErrors);
    
    if (rowErrors.length === 0) {
      // Convert row to ClientImportData
      const data: Record<string, string> = {};
      headers.forEach((header, colIndex) => {
        data[header.toLowerCase().trim()] = row[colIndex]?.trim() || '';
      });
      
      const clientData: ClientImportData = {
        username: data.username,
        password: data.password,
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        isAdmin: data.isadmin ? 
          ['true', 'yes', '1'].includes(data.isadmin.toLowerCase()) : false,
        departmentTypes: data.departmenttypes ? 
          data.departmenttypes.split(',').map(d => d.trim()) : undefined,
        locationName: data.locationname || undefined,
        locationAddress: data.locationaddress || undefined,
        locationCity: data.locationcity || undefined,
        locationCountry: data.locationcountry || undefined,
      };
      
      validData.push(clientData);
    }
  });
  
  return {
    success: errors.length === 0,
    data: validData,
    errors,
    totalRows: dataRows.length,
    validRows: validData.length,
    invalidRows: errors.length > 0 ? dataRows.length - validData.length : 0
  };
}

/**
 * Generates a CSV template for client import
 * @returns CSV template string
 */
export function generateClientImportTemplate(): string {
  const headers = [
    'username',
    'password', 
    'name',
    'email',
    'phone',
    'isAdmin',
    'departmentTypes',
    'locationName',
    'locationAddress',
    'locationCity',
    'locationCountry'
  ];
  
  const sampleData = [
    'client1',
    'Password123!',
    'Company One',
    'email@example.com',
    '+123456789',
    'false',
    'finance,purchase',
    'Head Office',
    '123 Main Street',
    'Riyadh',
    'Saudi Arabia'
  ];
  
  const csvRows = [
    headers.join(','),
    sampleData.join(',')
  ];
  
  return '\uFEFF' + csvRows.join('\n'); // Add BOM for proper encoding
}

/**
 * Downloads a CSV template file
 * @param filename - Template filename
 */
export function downloadCSVTemplate(filename: string = 'client_import_template.csv'): void {
  const template = generateClientImportTemplate();
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
