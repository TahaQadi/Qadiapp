/**
 * Utility functions for CSV export functionality
 */

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  delimiter?: string;
  includeBOM?: boolean; // For proper Arabic encoding
}

/**
 * Converts an array of objects to CSV format with proper Arabic encoding
 * @param data - Array of objects to convert
 * @param options - Export options
 * @returns CSV string with UTF-8 BOM for proper Arabic encoding
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): string {
  const {
    includeHeaders = true,
    delimiter = ',',
    includeBOM = true // Default to true for Arabic support
  } = options;

  if (data.length === 0) {
    return includeBOM ? '\uFEFF' : '';
  }

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Add headers
  if (includeHeaders) {
    csvRows.push(headers.join(delimiter));
  }

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle null/undefined values
      if (value === null || value === undefined) {
        return '';
      }
      // Escape values that contain delimiter, newline, or quotes
      const stringValue = String(value);
      if (stringValue.includes(delimiter) || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(delimiter));
  }

  const csvContent = csvRows.join('\n');
  
  // Add UTF-8 BOM for proper Arabic encoding in Excel
  return includeBOM ? '\uFEFF' + csvContent : csvContent;
}

/**
 * Downloads a CSV file with proper encoding
 * @param csvContent - CSV content string
 * @param filename - Filename for the download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Ensure proper MIME type for UTF-8 with BOM
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

/**
 * Formats a date for CSV export
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateForCSV(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD format
}

/**
 * Formats a timestamp for CSV export with proper localization
 * @param date - Date to format
 * @param language - Language for formatting ('en' or 'ar')
 * @returns Formatted timestamp string
 */
export function formatTimestampForCSV(date: string | Date, language: string = 'en'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  
  return d.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Formats department types for CSV export
 * @param departments - Array of department objects
 * @returns Comma-separated string of department types
 */
export function formatDepartmentsForCSV(departments: Array<{ departmentType: string }>): string {
  if (!departments || departments.length === 0) {
    return '';
  }
  
  const types = departments.map(dept => {
    const typeMap: Record<string, string> = {
      finance: 'Finance',
      purchase: 'Purchase', 
      warehouse: 'Warehouse',
      sales: 'Sales',
      operations: 'Operations',
      other: 'Other'
    };
    return typeMap[dept.departmentType] || dept.departmentType;
  });
  
  return types.join(', ');
}

/**
 * Formats locations for CSV export
 * @param locations - Array of location objects
 * @returns Formatted location summary
 */
export function formatLocationsForCSV(locations: Array<{ nameEn: string; nameAr: string; isHeadquarters: boolean }>): string {
  if (!locations || locations.length === 0) {
    return '';
  }
  
  const headquarters = locations.find(loc => loc.isHeadquarters);
  const count = locations.length;
  
  if (headquarters) {
    return `${count} locations (HQ: ${headquarters.nameEn})`;
  }
  
  return `${count} locations`;
}
