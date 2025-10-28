/**
 * Utility functions for CSV export functionality
 */

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  delimiter?: string;
}

/**
 * Converts an array of objects to CSV format
 * @param data - Array of objects to convert
 * @param options - Export options
 * @returns CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): string {
  const {
    includeHeaders = true,
    delimiter = ','
  } = options;

  if (data.length === 0) {
    return '';
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

  return csvRows.join('\n');
}

/**
 * Downloads a CSV file
 * @param csvContent - CSV content string
 * @param filename - Filename for the download
 */
export function downloadCSV(csvContent: string, filename: string): void {
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
 * Formats a timestamp for CSV export
 * @param date - Date to format
 * @returns Formatted timestamp string
 */
export function formatTimestampForCSV(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString();
}
