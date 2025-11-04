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

export interface DepartmentImportData {
  departmentType: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface LocationImportData {
  name: string;
  address: string;
  city?: string;
  country?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  isHeadquarters?: boolean;
}

export interface ClientImportData {
  // Basic fields
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  isAdmin?: boolean;
  // Organization fields
  domain?: string;
  registrationId?: string;
  industry?: string;
  hqCity?: string;
  hqCountry?: string;
  // Commercial fields
  paymentTerms?: string;
  priceTier?: string;
  riskTier?: 'A' | 'B' | 'C';
  contractModel?: 'PO' | 'LTA' | 'Subscription';
  // Departments (multiple)
  departments?: DepartmentImportData[];
  // Locations (multiple)
  locations?: LocationImportData[];
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
        
        // Filter out comment lines (lines starting with #)
        const nonCommentLines = lines.filter(line => {
          const trimmed = line.trim();
          return trimmed.length > 0 && !trimmed.startsWith('#');
        });
        
        const data = nonCommentLines.map(line => {
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
  
  // Risk tier validation
  if (data.risktier && data.risktier.length > 0) {
    const validValues = ['A', 'B', 'C'];
    if (!validValues.includes(data.risktier.toUpperCase())) {
      errors.push({
        row: rowIndex,
        field: 'riskTier',
        message: 'riskTier must be A, B, or C'
      });
    }
  }
  
  // Contract model validation
  if (data.contractmodel && data.contractmodel.length > 0) {
    const validValues = ['PO', 'LTA', 'Subscription'];
    if (!validValues.includes(data.contractmodel)) {
      errors.push({
        row: rowIndex,
        field: 'contractModel',
        message: 'contractModel must be PO, LTA, or Subscription'
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
  
  // Helper function to parse departments
  function parseDepartments(deptStr: string): DepartmentImportData[] | undefined {
    if (!deptStr || deptStr.trim() === '') return undefined;
    
    try {
      // Try JSON format first
      if (deptStr.trim().startsWith('[')) {
        return JSON.parse(deptStr);
      }
      
      // Otherwise parse pipe-separated format: type|name|email|phone
      const departments: DepartmentImportData[] = [];
      const deptEntries = deptStr.split('||').filter(d => d.trim());
      
      for (const entry of deptEntries) {
        const parts = entry.split('|').map(p => p.trim());
        if (parts.length >= 1 && parts[0]) {
          departments.push({
            departmentType: parts[0],
            contactName: parts[1] || undefined,
            contactEmail: parts[2] || undefined,
            contactPhone: parts[3] || undefined,
          });
        }
      }
      
      return departments.length > 0 ? departments : undefined;
    } catch {
      // Fallback: treat as comma-separated department types
      return deptStr.split(',').map(d => ({
        departmentType: d.trim()
      })).filter(d => d.departmentType);
    }
  }
  
  // Helper function to parse locations
  function parseLocations(locStr: string): LocationImportData[] | undefined {
    if (!locStr || locStr.trim() === '') return undefined;
    
    try {
      // Try JSON format first
      if (locStr.trim().startsWith('[')) {
        return JSON.parse(locStr);
      }
      
      // Otherwise parse pipe-separated format: name|address|city|country|phone|latitude|longitude|isHQ
      const locations: LocationImportData[] = [];
      const locEntries = locStr.split('||').filter(l => l.trim());
      
      for (const entry of locEntries) {
        const parts = entry.split('|').map(p => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          locations.push({
            name: parts[0],
            address: parts[1],
            city: parts[2] || undefined,
            country: parts[3] || undefined,
            phone: parts[4] || undefined,
            latitude: parts[5] ? parseFloat(parts[5]) : undefined,
            longitude: parts[6] ? parseFloat(parts[6]) : undefined,
            isHeadquarters: parts[7] ? ['true', 'yes', '1', 'yes'].includes(parts[7].toLowerCase()) : false,
          });
        }
      }
      
      return locations.length > 0 ? locations : undefined;
    } catch {
      return undefined;
    }
  }
  
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
        // Organization fields
        domain: data.domain || undefined,
        registrationId: data.registrationid || undefined,
        industry: data.industry || undefined,
        hqCity: data.hqcity || undefined,
        hqCountry: data.hqcountry || undefined,
        // Commercial fields
        paymentTerms: data.paymentterms || undefined,
        priceTier: data.pricetier || undefined,
        riskTier: data.risktier ? (data.risktier.toUpperCase() as 'A' | 'B' | 'C') : undefined,
        contractModel: data.contractmodel ? (data.contractmodel as 'PO' | 'LTA' | 'Subscription') : undefined,
        // Departments
        departments: parseDepartments(data.departments || ''),
        // Locations
        locations: parseLocations(data.locations || ''),
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
    'domain',
    'registrationId',
    'industry',
    'hqCity',
    'hqCountry',
    'paymentTerms',
    'priceTier',
    'riskTier',
    'contractModel',
    'departments',
    'locations'
  ];
  
  // Sample data with all fields
  const sampleData = [
    'client1',                    // username
    'Password123!',               // password
    'Company One',                // name
    'email@example.com',          // email
    '+123456789',                 // phone
    'false',                      // isAdmin
    'example.com',                // domain
    'REG-123456',                 // registrationId
    'Technology',                 // industry
    'Riyadh',                     // hqCity
    'Saudi Arabia',               // hqCountry
    'Net 30',                     // paymentTerms
    'Tier 1',                     // priceTier
    'A',                          // riskTier
    'LTA',                        // contractModel
    'finance|John Doe|john@example.com|+123456789||purchase|Jane Smith|jane@example.com|+987654321', // departments
    'Head Office|123 Main Street|Riyadh|Saudi Arabia|+123456789|24.7136|46.6753|true||Warehouse|456 Industrial Ave|Jeddah|Saudi Arabia||21.5433|39.1728|false' // locations
  ];
  
  // Escape values that contain commas or quotes
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
  // Build template with comments
  const commentLines = [
    '# Client Import Template',
    '# Format: CSV with UTF-8 encoding',
    '#',
    '# BASIC FIELDS (Required: username, password, name)',
    '# username: Unique username (min 3 characters)',
    '# password: Password (min 6 characters)',
    '# name: Company name',
    '# email: Email address (optional)',
    '# phone: Phone number (optional)',
    '# isAdmin: true/false (optional, default: false)',
    '#',
    '# ORGANIZATION FIELDS (Optional)',
    '# domain: Website domain',
    '# registrationId: Registration/VAT number',
    '# industry: Industry sector',
    '# hqCity: Headquarters city',
    '# hqCountry: Headquarters country',
    '#',
    '# COMMERCIAL FIELDS (Optional)',
    '# paymentTerms: Payment terms (e.g., Net 30)',
    '# priceTier: Price tier level',
    '# riskTier: A, B, or C',
    '# contractModel: PO, LTA, or Subscription',
    '#',
    '# DEPARTMENTS (Optional)',
    '# Format: type|contactName|contactEmail|contactPhone || type2|name2|email2|phone2',
    '# Example: finance|John Doe|john@example.com|+123456789 || purchase|Jane Smith|jane@example.com|+987654321',
    '# Valid types: finance, purchase, warehouse',
    '#',
    '# LOCATIONS (Optional)',
    '# Format: name|address|city|country|phone|latitude|longitude|isHQ || name2|address2|...',
    '# Example: Head Office|123 Main St|Riyadh|Saudi Arabia|+123456789|24.7136|46.6753|true',
    '# isHQ: true/false (indicates if this is the headquarters location)',
    '#',
  ];
  
  const csvRows = [
    ...commentLines,
    headers.join(','),
    sampleData.map(escapeCSV).join(',')
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
