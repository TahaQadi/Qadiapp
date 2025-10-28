
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

    // Log for admin notification (could be enhanced with actual notification system)

    res.json({ success: true, requestId: request.id });
  } catch (error) {
    console.error('Demo request error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to submit demo request' });
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

export default router;
