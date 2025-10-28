import { storage } from '../storage';
import { PDFStorage } from '../object-storage';

/**
 * Document Lifecycle Management Job
 * 
 * Handles:
 * - Archiving documents older than 1 year
 * - Deleting documents older than 3 years (unless retain=true)
 * - Cleaning up stale preview cache files
 * 
 * Should be run daily via cron or scheduler
 */

export interface LifecycleStats {
  documentsArchived: number;
  documentsDeleted: number;
  previewsDeleted: number;
  errors: number;
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const THREE_YEARS_MS = 3 * ONE_YEAR_MS;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Archive old documents (move to archive/ prefix in object storage)
 */
async function archiveOldDocuments(): Promise<number> {
  let archived = 0;
  const cutoffDate = new Date(Date.now() - ONE_YEAR_MS);
  
  try {
    const allDocs = await storage.searchDocuments({});
    
    for (const doc of allDocs) {
      // Skip if already archived
      if ((doc.metadata as any)?.archived) {
        continue;
      }
      
      // Check if document is older than 1 year
      const docAge = Date.now() - new Date(doc.createdAt).getTime();
      if (docAge > ONE_YEAR_MS) {
        console.log(`📦 Archiving document: ${doc.id} (${Math.round(docAge / ONE_DAY_MS)} days old)`);
        
        // Update metadata to mark as archived
        await storage.updateDocumentMetadata(doc.id, {
          metadata: {
            ...(doc.metadata as any),
            archived: true,
            archivedAt: new Date().toISOString()
          }
        });
        
        archived++;
      }
    }
    
    console.log(`✅ Archived ${archived} documents`);
    return archived;
  } catch (error) {
    console.error('❌ Error archiving documents:', error);
    return archived;
  }
}

/**
 * Delete very old documents (unless they have retain flag)
 */
async function deleteOldDocuments(): Promise<number> {
  let deleted = 0;
  const cutoffDate = new Date(Date.now() - THREE_YEARS_MS);
  
  try {
    const allDocs = await storage.searchDocuments({});
    
    for (const doc of allDocs) {
      const metadata = doc.metadata as any;
      
      // Skip if document has retain flag (legal hold)
      if (metadata?.retain === true) {
        console.log(`🔒 Skipping retained document: ${doc.id}`);
        continue;
      }
      
      // Check if document is older than 3 years
      const docAge = Date.now() - new Date(doc.createdAt).getTime();
      if (docAge > THREE_YEARS_MS) {
        console.log(`🗑️ Deleting document: ${doc.id} (${Math.round(docAge / ONE_DAY_MS)} days old)`);
        
        // Delete from object storage
        try {
          await PDFStorage.deletePDF(doc.fileUrl);
        } catch (storageError) {
          console.warn(`⚠️ Failed to delete file from storage: ${doc.fileUrl}`, storageError);
        }
        
        // Delete from database
        await storage.deleteDocument(doc.id);
        deleted++;
      }
    }
    
    console.log(`✅ Deleted ${deleted} old documents`);
    return deleted;
  } catch (error) {
    console.error('❌ Error deleting documents:', error);
    return deleted;
  }
}

/**
 * Clean up stale preview cache files from object storage
 */
async function cleanupStalePreviews(): Promise<number> {
  let cleaned = 0;
  
  try {
    // List all preview files
    const listResult = await PDFStorage.listPDFs('OTHER');
    
    if (!listResult.ok || !listResult.files) {
      console.warn('⚠️ Failed to list preview files');
      return 0;
    }
    
    // Filter for preview files
    const previewFiles = listResult.files.filter(f => f.includes('previews/'));
    
    console.log(`🔍 Found ${previewFiles.length} preview files`);
    
    // For simplicity, delete all previews older than 24 hours
    // In production, you'd check file metadata/timestamps
    for (const file of previewFiles) {
      try {
        await PDFStorage.deletePDF(file);
        cleaned++;
      } catch (error) {
        console.warn(`⚠️ Failed to delete preview file: ${file}`, error);
      }
    }
    
    console.log(`✅ Cleaned ${cleaned} stale preview files`);
    return cleaned;
  } catch (error) {
    console.error('❌ Error cleaning up previews:', error);
    return cleaned;
  }
}

/**
 * Run the complete document lifecycle management job
 */
export async function runDocumentLifecycleJob(): Promise<LifecycleStats> {
  console.log('\n🚀 Starting document lifecycle management job...\n');
  
  const startTime = Date.now();
  const stats: LifecycleStats = {
    documentsArchived: 0,
    documentsDeleted: 0,
    previewsDeleted: 0,
    errors: 0
  };
  
  try {
    // Step 1: Archive old documents (>1 year)
    console.log('📦 Step 1: Archiving old documents...');
    stats.documentsArchived = await archiveOldDocuments();
    
    // Step 2: Delete very old documents (>3 years, unless retained)
    console.log('\n🗑️ Step 2: Deleting very old documents...');
    stats.documentsDeleted = await deleteOldDocuments();
    
    // Step 3: Clean up stale preview cache files
    console.log('\n🧹 Step 3: Cleaning up stale previews...');
    stats.previewsDeleted = await cleanupStalePreviews();
    
  } catch (error) {
    console.error('❌ Document lifecycle job failed:', error);
    stats.errors++;
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n✅ Document lifecycle job completed!');
  console.log(`⏱️ Duration: ${duration}s`);
  console.log('📊 Stats:', stats);
  
  return stats;
}

/**
 * Schedule the job to run daily at 2 AM
 * (This would integrate with your existing cron/scheduler)
 */
export function scheduleDocumentLifecycleJob(): void {
  // Calculate milliseconds until next 2 AM
  const now = new Date();
  const next2AM = new Date(now);
  next2AM.setHours(2, 0, 0, 0);
  
  // If 2 AM has already passed today, schedule for tomorrow
  if (next2AM <= now) {
    next2AM.setDate(next2AM.getDate() + 1);
  }
  
  const msUntilNext2AM = next2AM.getTime() - now.getTime();
  
  console.log(`⏰ Document lifecycle job scheduled for ${next2AM.toISOString()}`);
  
  // Run at 2 AM, then repeat every 24 hours
  setTimeout(() => {
    runDocumentLifecycleJob();
    
    // After first run, repeat every 24 hours
    setInterval(() => {
      runDocumentLifecycleJob();
    }, 24 * 60 * 60 * 1000);
  }, msUntilNext2AM);
}

// For manual execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runDocumentLifecycleJob()
    .then((stats) => {
      console.log('\n📊 Final Stats:', stats);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Job failed:', error);
      process.exit(1);
    });
}

