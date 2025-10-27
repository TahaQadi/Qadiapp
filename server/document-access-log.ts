
import { db } from './db';
import { sql } from 'drizzle-orm';

interface DocumentAccessLog {
  id: string;
  documentId: string;
  clientId: string;
  action: 'view' | 'download' | 'generate';
  ipAddress: string | null;
  userAgent: string | null;
  accessedAt: Date;
}

export async function createDocumentAccessLog(data: Omit<DocumentAccessLog, 'id'>): Promise<void> {
  await db.execute(sql`
    INSERT INTO document_access_logs (
      id, document_id, client_id, action, ip_address, user_agent, accessed_at
    ) VALUES (
      gen_random_uuid(), ${data.documentId}, ${data.clientId}, ${data.action}, 
      ${data.ipAddress}, ${data.userAgent}, ${data.accessedAt}
    )
  `);
}

export async function getDocumentAccessLogs(documentId: string): Promise<DocumentAccessLog[]> {
  const result = await db.execute(sql`
    SELECT * FROM document_access_logs 
    WHERE document_id = ${documentId}
    ORDER BY accessed_at DESC
    LIMIT 100
  `);
  
  return result.rows as unknown as DocumentAccessLog[];
}
