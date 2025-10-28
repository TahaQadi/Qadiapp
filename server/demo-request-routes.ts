
import { Router, Request, Response } from 'express';
import { db } from './db';
import { demoRequests } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin } from './auth';

const router = Router();

const demoRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  company: z.string().min(2),
  message: z.string().optional(),
});

// Create demo request
router.post('/api/demo-request', async (req: Request, res: Response) => {
  try {
    const data = demoRequestSchema.parse(req.body);
    
    const [request] = await db.insert(demoRequests).values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      message: data.message || null,
      status: 'pending',
    }).returning();

    console.log('Demo request created:', request.id);

    return res.status(200).json({ success: true, requestId: request.id });
  } catch (error) {
    console.error('Demo request error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid request data', 
        details: error.errors 
      });
    }
    return res.status(500).json({ 
      success: false,
      error: 'Failed to submit demo request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all demo requests (admin only)
router.get('/api/admin/demo-requests', requireAdmin, async (req: Request, res: Response) => {
  try {
    const requests = await db.select().from(demoRequests).orderBy(desc(demoRequests.createdAt));

    res.json(requests);
  } catch (error) {
    console.error('Error fetching demo requests:', error);
    res.status(500).json({ error: 'Failed to fetch demo requests' });
  }
});

// Update demo request status (admin only)
router.patch('/api/admin/demo-requests/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const [updated] = await db.update(demoRequests)
      .set({
        status,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(demoRequests.id, parseInt(id)))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error updating demo request:', error);
    res.status(500).json({ error: 'Failed to update demo request' });
  }
});

// Delete demo request (admin only)
router.delete('/api/admin/demo-requests/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [deleted] = await db.delete(demoRequests)
      .where(eq(demoRequests.id, parseInt(id)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    res.json({ success: true, message: 'Demo request deleted successfully' });
  } catch (error) {
    console.error('Error deleting demo request:', error);
    res.status(500).json({ error: 'Failed to delete demo request' });
  }
});

export default router;
