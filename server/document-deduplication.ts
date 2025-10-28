import crypto from 'crypto';
import { storage } from './storage';

/**
 * Document Deduplication Utility
 * 
 * Prevents duplicate document generation by checking if an identical document
 * (same template + variables + entity) already exists.
 */

export interface DeduplicationOptions {
  templateId: string;
  variables: Array<{ key: string; value: any }>;
  entityId?: string; // orderId, priceOfferId, ltaId, etc.
  entityType?: 'order' | 'priceOffer' | 'lta' | 'client';
  force?: boolean; // Force regeneration even if duplicate exists
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  existingDocument?: any;
  variablesHash: string;
}

/**
 * Compute a stable hash of the variables
 * Uses SHA-256 for collision resistance
 */
export function computeVariablesHash(variables: Array<{ key: string; value: any }>): string {
  // Sort variables by key for stable hashing
  const sorted = variables
    .map(v => ({ key: v.key, value: v.value }))
    .sort((a, b) => a.key.localeCompare(b.key));
  
  // Convert to JSON and hash
  const jsonString = JSON.stringify(sorted, null, 0);
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

/**
 * Check if a duplicate document exists
 * Returns the existing document if found and force=false
 */
export async function checkDuplicateDocument(
  options: DeduplicationOptions
): Promise<DeduplicationResult> {
  const { templateId, variables, entityId, entityType, force } = options;
  
  // Compute variables hash
  const variablesHash = computeVariablesHash(variables);
  
  // If force flag is set, skip duplicate check
  if (force) {
    console.log('🔄 Force flag set, skipping deduplication check');
    return {
      isDuplicate: false,
      variablesHash
    };
  }
  
  // Search for existing document with same hash
  try {
    const searchCriteria: any = {};
    
    // Add entity-specific filters
    if (entityId && entityType) {
      switch (entityType) {
        case 'order':
          searchCriteria.orderId = entityId;
          break;
        case 'priceOffer':
          searchCriteria.priceOfferId = entityId;
          break;
        case 'lta':
          searchCriteria.ltaId = entityId;
          break;
        case 'client':
          searchCriteria.clientId = entityId;
          break;
      }
    }
    
    // Get all documents matching the criteria
    const documents = await storage.searchDocuments(searchCriteria);
    
    // Find document with matching template and variables hash
    const existingDoc = documents.find(doc => {
      const docMetadata = doc.metadata as any;
      return (
        docMetadata?.templateId === templateId &&
        docMetadata?.variablesHash === variablesHash
      );
    });
    
    if (existingDoc) {
      console.log(`♻️ Duplicate document found: ${existingDoc.id}`);
      return {
        isDuplicate: true,
        existingDocument: existingDoc,
        variablesHash
      };
    }
    
    // No duplicate found
    return {
      isDuplicate: false,
      variablesHash
    };
  } catch (error) {
    console.error('❌ Error checking for duplicate document:', error);
    // On error, proceed with generation (fail open)
    return {
      isDuplicate: false,
      variablesHash
    };
  }
}

/**
 * Get duplicate statistics for monitoring
 */
export async function getDeduplicationStats(days: number = 30): Promise<{
  totalDocuments: number;
  uniqueDocuments: number;
  duplicatesSaved: number;
  savingsPercentage: number;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.setDate() - days);
    
    // This is a simplified version - in production, you'd query the database
    // with proper date filtering
    const allDocs = await storage.searchDocuments({});
    
    // Count unique by variablesHash
    const hashCounts = new Map<string, number>();
    allDocs.forEach(doc => {
      const hash = (doc.metadata as any)?.variablesHash;
      if (hash) {
        hashCounts.set(hash, (hashCounts.get(hash) || 0) + 1);
      }
    });
    
    const totalDocuments = allDocs.length;
    const uniqueDocuments = hashCounts.size;
    const duplicatesSaved = totalDocuments - uniqueDocuments;
    const savingsPercentage = totalDocuments > 0
      ? (duplicatesSaved / totalDocuments) * 100
      : 0;
    
    return {
      totalDocuments,
      uniqueDocuments,
      duplicatesSaved,
      savingsPercentage: Math.round(savingsPercentage * 100) / 100
    };
  } catch (error) {
    console.error('Error computing deduplication stats:', error);
    return {
      totalDocuments: 0,
      uniqueDocuments: 0,
      duplicatesSaved: 0,
      savingsPercentage: 0
    };
  }
}

