import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// ============================================
// DASHBOARD STATS
// ============================================

/**
 * GET /api/admin/stats
 * Dashboard overview stats.
 */
router.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      pendingAtlas,
      pendingItineraries,
      totalUsers,
      totalAtlasFiles,
      totalItineraries,
    ] = await Promise.all([
      prisma.atlasFile.count({ where: { moderation_status: 'pending' } }),
      prisma.itinerary.count({ where: { is_published: true, moderation_status: 'pending' } }),
      prisma.userProfile.count(),
      prisma.atlasFile.count(),
      prisma.itinerary.count(),
    ]);

    res.json({
      data: {
        pending_atlas: pendingAtlas,
        pending_itineraries: pendingItineraries,
        total_pending: pendingAtlas + pendingItineraries,
        total_users: totalUsers,
        total_atlas_files: totalAtlasFiles,
        total_itineraries: totalItineraries,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CONTENT MODERATION — ATLAS FILES
// ============================================

/**
 * GET /api/admin/atlas/pending
 * List atlas files pending review.
 */
router.get('/atlas/pending', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const files = await prisma.atlasFile.findMany({
      where: { moderation_status: 'pending' },
      orderBy: { updated_at: 'desc' },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1,
          select: { id: true, version_number: true, status: true },
        },
      },
    });

    res.json({ data: files });
  } catch (error: any) {
    console.error('Error listing pending atlas files:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/atlas/all
 * List ALL atlas files with moderation status.
 */
router.get('/atlas/all', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const files = await prisma.atlasFile.findMany({
      orderBy: { updated_at: 'desc' },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1,
          select: { id: true, version_number: true, status: true, published_at: true },
        },
      },
    });

    res.json({ data: files });
  } catch (error: any) {
    console.error('Error listing all atlas files:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/atlas/:id/approve
 * Approve an atlas file for public visibility.
 */
router.post('/atlas/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const updated = await prisma.atlasFile.update({
      where: { id },
      data: {
        moderation_status: 'approved',
        published_at: new Date(),
      },
    });

    res.json({ data: updated });
  } catch (error: any) {
    console.error('Error approving atlas file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/atlas/:id/reject
 * Reject an atlas file.
 */
router.post('/atlas/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const updated = await prisma.atlasFile.update({
      where: { id },
      data: {
        moderation_status: 'rejected',
        published_at: null,
      },
    });

    res.json({ data: updated });
  } catch (error: any) {
    console.error('Error rejecting atlas file:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CONTENT MODERATION — ITINERARIES
// ============================================

/**
 * GET /api/admin/itineraries/pending
 * List published itineraries pending review.
 */
router.get('/itineraries/pending', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const itineraries = await prisma.itinerary.findMany({
      where: { is_published: true, moderation_status: 'pending' },
      orderBy: { updated_at: 'desc' },
    });

    res.json({ data: itineraries });
  } catch (error: any) {
    console.error('Error listing pending itineraries:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/itineraries/:id/approve
 */
router.post('/itineraries/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const updated = await prisma.itinerary.update({
      where: { id },
      data: { moderation_status: 'approved' },
    });

    res.json({ data: updated });
  } catch (error: any) {
    console.error('Error approving itinerary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/itineraries/:id/reject
 */
router.post('/itineraries/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const updated = await prisma.itinerary.update({
      where: { id },
      data: { moderation_status: 'rejected', is_published: false },
    });

    res.json({ data: updated });
  } catch (error: any) {
    console.error('Error rejecting itinerary:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/admin/users
 * List all users with content counts.
 */
router.get('/users', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.userProfile.findMany({
      orderBy: { created_at: 'desc' },
    });

    // Get content counts per user with individual count queries
    const enriched = await Promise.all(
      users.map(async (u) => {
        const [atlasCount, itineraryCount] = await Promise.all([
          prisma.atlasFile.count({ where: { author_id: u.id } }),
          prisma.itinerary.count({ where: { user_id: u.id } }),
        ]);
        return {
          ...u,
          atlas_count: atlasCount,
          itinerary_count: itineraryCount,
        };
      })
    );

    res.json({ data: enriched });
  } catch (error: any) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users/:id/role
 * Update a user's role.
 */
router.post('/users/:id/role', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be "user" or "admin".' });
      return;
    }

    const updated = await prisma.userProfile.update({
      where: { id },
      data: { role },
    });

    res.json({ data: updated });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
