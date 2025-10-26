
import { db } from "./db";
import { sql } from "drizzle-orm";

export interface ErrorContext {
  route?: string;
  userId?: string;
  orderId?: string;
  requestBody?: any;
  userAgent?: string;
  ipAddress?: string;
  [key: string]: any;
}

export type LogLevel = 'error' | 'warning' | 'info';

export interface ErrorLog {
  id: string;
  level: LogLevel;
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: Date;
}

class ErrorLogger {
  private initialized = false;

  private async ensureTableExists(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if table exists, create if not
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS error_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          level VARCHAR(20) NOT NULL CHECK (level IN ('error', 'warning', 'info')),
          message TEXT NOT NULL,
          stack TEXT,
          context JSONB,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create indexes if they don't exist
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC)
      `);

      this.initialized = true;
    } catch (error) {
      console.error('[ErrorLogger] Failed to initialize table:', error);
    }
  }

  private async saveToDatabase(
    level: LogLevel,
    message: string,
    stack: string | undefined,
    context: ErrorContext
  ): Promise<void> {
    await this.ensureTableExists();
    try {
      await db.execute(sql`
        INSERT INTO error_logs (id, level, message, stack, context, timestamp)
        VALUES (
          gen_random_uuid(),
          ${level},
          ${message},
          ${stack || null},
          ${JSON.stringify(context)}::jsonb,
          NOW()
        )
      `);
    } catch (dbError) {
      // Fallback to console if database fails
      console.error('[ErrorLogger] Failed to save to database:', dbError);
      console.error('[ErrorLogger] Original error:', { level, message, stack, context });
    }
  }

  logError(error: Error, context: ErrorContext = {}): void {
    const message = error.message || 'Unknown error';
    const stack = error.stack;

    // Log to console immediately
    console.error(`[ERROR] ${message}`, {
      ...context,
      stack: stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines
    });

    // Save to database asynchronously
    this.saveToDatabase('error', message, stack, context).catch(console.error);

    // Alert on critical errors
    if (this.isCritical(message, context)) {
      this.sendCriticalAlert(message, context);
    }
  }

  logWarning(message: string, context: ErrorContext = {}): void {
    console.warn(`[WARNING] ${message}`, context);
    this.saveToDatabase('warning', message, undefined, context).catch(console.error);
  }

  logInfo(message: string, context: ErrorContext = {}): void {
    console.info(`[INFO] ${message}`, context);
    this.saveToDatabase('info', message, undefined, context).catch(console.error);
  }

  private isCritical(message: string, context: ErrorContext): boolean {
    // Define critical error patterns
    const criticalPatterns = [
      /database.*connection/i,
      /payment.*failed/i,
      /authentication.*error/i,
      /security.*violation/i,
      /data.*corruption/i,
    ];

    return criticalPatterns.some(pattern => pattern.test(message)) ||
           context.route?.includes('/api/client/orders') ||
           context.route?.includes('/api/admin/');
  }

  private sendCriticalAlert(message: string, context: ErrorContext): void {
    // In production, this would send alerts via email, Slack, etc.
    console.error('🚨 CRITICAL ERROR ALERT 🚨', {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  async getRecentErrors(limit: number = 50): Promise<ErrorLog[]> {
    try {
      const result = await db.execute(sql`
        SELECT id, level, message, stack, context, timestamp
        FROM error_logs
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `);

      return result.rows.map((row: any) => ({
        id: row.id,
        level: row.level,
        message: row.message,
        stack: row.stack,
        context: row.context,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      console.error('[ErrorLogger] Failed to fetch errors:', error);
      return [];
    }
  }

  async getErrorsByLevel(level: LogLevel, limit: number = 50): Promise<ErrorLog[]> {
    try {
      const result = await db.execute(sql`
        SELECT id, level, message, stack, context, timestamp
        FROM error_logs
        WHERE level = ${level}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `);

      return result.rows.map((row: any) => ({
        id: row.id,
        level: row.level,
        message: row.message,
        stack: row.stack,
        context: row.context,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      console.error('[ErrorLogger] Failed to fetch errors by level:', error);
      return [];
    }
  }

  async getErrorStats(): Promise<{
    total: number;
    byLevel: Record<LogLevel, number>;
    recentCount24h: number;
  }> {
    try {
      const result = await db.execute(sql`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN level = 'error' THEN 1 ELSE 0 END) as error_count,
          SUM(CASE WHEN level = 'warning' THEN 1 ELSE 0 END) as warning_count,
          SUM(CASE WHEN level = 'info' THEN 1 ELSE 0 END) as info_count,
          SUM(CASE WHEN timestamp > NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as recent_count
        FROM error_logs
      `);

      const row = result.rows[0] as any;

      return {
        total: parseInt(row.total) || 0,
        byLevel: {
          error: parseInt(row.error_count) || 0,
          warning: parseInt(row.warning_count) || 0,
          info: parseInt(row.info_count) || 0,
        },
        recentCount24h: parseInt(row.recent_count) || 0,
      };
    } catch (error) {
      console.error('[ErrorLogger] Failed to fetch error stats:', error);
      return {
        total: 0,
        byLevel: { error: 0, warning: 0, info: 0 },
        recentCount24h: 0,
      };
    }
  }

  async clearOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const result = await db.execute(sql`
        DELETE FROM error_logs
        WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
      `);

      return result.rowCount || 0;
    } catch (error) {
      console.error('[ErrorLogger] Failed to clear old logs:', error);
      return 0;
    }
  }
}

export const errorLogger = new ErrorLogger();
