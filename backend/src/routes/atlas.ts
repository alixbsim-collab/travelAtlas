import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import prisma from '../prisma';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest, AtlasFileCreateInput, AtlasFileUpdateInput, VersionContentInput } from '../types';

const router = Router();

// Supabase client for forking (inserting into itineraries/activities)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * GET /api/atlas
 * List published atlas files with latest published version info.
 * Supports ?limit=N and ?fields=id,title,destination
 */
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const fields = (req.query.fields as string)?.split(',');

    const atlasFiles = await prisma.atlasFile.findMany({
      where: {
        published_at: { not: null },
        moderation_status: 'approved',
        versions: { some: { status: 'published' } },
      },
      orderBy: { published_at: 'desc' },
      take: limit,
      include: {
        versions: {
          where: { status: 'published' },
          orderBy: { version_number: 'desc' },
          take: 1,
          select: { id: true, version_number: true, published_at: true },
        },
      },
    });

    // If specific fields requested, return minimal data
    if (fields) {
      const minimal = atlasFiles.map((f: any) => {
        const result: any = {};
        for (const field of fields) {
          if (field in f) result[field] = (f as any)[field];
        }
        return result;
      });
      res.json({ data: minimal });
      return;
    }

    res.json({ data: atlasFiles });
  } catch (error: any) {
    console.error('Error listing atlas files:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/atlas/mine
 * List current user's atlas files (all statuses).
 */
router.get('/mine', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userName = req.user!.user_metadata?.full_name || req.user!.email?.split('@')[0] || '';

    const atlasFiles = await prisma.atlasFile.findMany({
      where: {
        OR: [
          { author_id: userId },
          ...(userName ? [{ author: userName }] : []),
        ],
      },
      orderBy: { updated_at: 'desc' },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1,
          select: { id: true, version_number: true, status: true, published_at: true },
        },
      },
    });

    res.json({ data: atlasFiles });
  } catch (error: any) {
    console.error('Error listing my atlas files:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/atlas/:id
 * Get atlas file with latest published version (full content: days + activities).
 * Falls back to latest draft if owner is requesting.
 */
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    const atlasFile: any = await prisma.atlasFile.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          include: {
            days: {
              orderBy: { day_number: 'asc' },
              include: {
                activities: { orderBy: { position: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!atlasFile) {
      res.status(404).json({ error: 'Atlas file not found' });
      return;
    }

    // Check access: must be published or owned by requester
    const isOwner = userId && (atlasFile.author_id === userId);
    if (!atlasFile.published_at && !isOwner) {
      res.status(404).json({ error: 'Atlas file not found' });
      return;
    }

    // Pick the right version: published for public, latest for owner
    let activeVersion = atlasFile.versions.find((v: any) => v.status === 'published');
    if (!activeVersion && isOwner) {
      activeVersion = atlasFile.versions[0]; // latest (any status)
    }

    // Build response — include legacy content field for backwards compat
    const response: any = {
      ...atlasFile,
      versions: undefined, // don't expose all versions here
      activeVersion: activeVersion ? {
        id: activeVersion.id,
        version_number: activeVersion.version_number,
        status: activeVersion.status,
        intro: activeVersion.intro,
        tips: activeVersion.tips,
        published_at: activeVersion.published_at,
        days: activeVersion.days,
      } : null,
    };

    // Also build legacy content shape for frontend backward compat
    if (activeVersion) {
      response.content = {
        intro: activeVersion.intro || '',
        tips: activeVersion.tips || '',
        days: activeVersion.days.map((d: any) => ({
          dayNumber: d.day_number,
          title: d.title,
          content: d.content || '',
          images: d.images || [],
        })),
      };
    }

    res.json({ data: response });
  } catch (error: any) {
    console.error('Error fetching atlas file:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AUTHENTICATED ENDPOINTS
// ============================================

/**
 * POST /api/atlas
 * Create new atlas file + initial draft version.
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userName = req.user!.user_metadata?.full_name || req.user!.email?.split('@')[0] || '';
    const input: AtlasFileCreateInput = req.body;

    const atlasFile = await prisma.atlasFile.create({
      data: {
        title: input.title,
        description: input.description,
        destination: input.destination,
        trip_length: input.trip_length,
        category: input.category,
        cover_image_url: input.cover_image_url,
        traveler_profiles: input.traveler_profiles || [],
        source_type: input.source_type || 'traveler',
        author_id: userId,
        author: userName,
        versions: {
          create: {
            version_number: 1,
            status: 'draft',
          },
        },
      },
      include: {
        versions: true,
      },
    });

    res.status(201).json({ data: atlasFile });
  } catch (error: any) {
    console.error('Error creating atlas file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/atlas/:id
 * Update atlas file metadata (owner only).
 */
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const input: AtlasFileUpdateInput = req.body;

    // Check ownership
    const existing = await prisma.atlasFile.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Atlas file not found' });
      return;
    }
    if (existing.author_id !== userId) {
      res.status(403).json({ error: 'Not authorized to edit this atlas file' });
      return;
    }

    const updated = await prisma.atlasFile.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.destination && { destination: input.destination }),
        ...(input.trip_length && { trip_length: input.trip_length }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.cover_image_url !== undefined && { cover_image_url: input.cover_image_url }),
        ...(input.traveler_profiles && { traveler_profiles: input.traveler_profiles }),
      },
    });

    res.json({ data: updated });
  } catch (error: any) {
    console.error('Error updating atlas file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/atlas/:id
 * Delete atlas file (owner or admin).
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const existing = await prisma.atlasFile.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Atlas file not found' });
      return;
    }

    // Check ownership or admin
    const profile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAdmin = profile?.role === 'admin';

    if (existing.author_id !== userId && !isAdmin) {
      res.status(403).json({ error: 'Not authorized to delete this atlas file' });
      return;
    }

    await prisma.atlasFile.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting atlas file:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// VERSION MANAGEMENT
// ============================================

/**
 * GET /api/atlas/:id/versions
 * List all versions for an atlas file (owner only).
 */
router.get('/:id/versions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const atlasFile = await prisma.atlasFile.findUnique({ where: { id } });
    if (!atlasFile || atlasFile.author_id !== userId) {
      res.status(404).json({ error: 'Atlas file not found' });
      return;
    }

    const versions = await prisma.atlasFileVersion.findMany({
      where: { atlas_file_id: id },
      orderBy: { version_number: 'desc' },
      select: {
        id: true,
        version_number: true,
        status: true,
        published_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    res.json({ data: versions });
  } catch (error: any) {
    console.error('Error listing versions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/atlas/:id/versions
 * Create new draft version. Copies content from latest published version if available.
 */
router.post('/:id/versions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const atlasFile = await prisma.atlasFile.findUnique({ where: { id } });
    if (!atlasFile || atlasFile.author_id !== userId) {
      res.status(404).json({ error: 'Atlas file not found' });
      return;
    }

    // Get highest version number
    const latestVersion: any = await prisma.atlasFileVersion.findFirst({
      where: { atlas_file_id: id },
      orderBy: { version_number: 'desc' },
      include: {
        days: {
          include: { activities: true },
        },
      },
    });

    const newVersionNumber = (latestVersion?.version_number || 0) + 1;

    // Create new version, copying content from latest if available
    const newVersion = await prisma.atlasFileVersion.create({
      data: {
        atlas_file_id: id,
        version_number: newVersionNumber,
        status: 'draft',
        intro: latestVersion?.intro,
        tips: latestVersion?.tips,
        days: latestVersion ? {
          create: latestVersion.days.map((day: any) => ({
            day_number: day.day_number,
            title: day.title,
            content: day.content,
            images: day.images,
            activities: {
              create: day.activities.map((act: any) => ({
                position: act.position,
                title: act.title,
                description: act.description,
                location: act.location,
                category: act.category,
                duration_minutes: act.duration_minutes,
                estimated_cost_min: act.estimated_cost_min,
                estimated_cost_max: act.estimated_cost_max,
                latitude: act.latitude,
                longitude: act.longitude,
                time_of_day: act.time_of_day,
              })),
            },
          })),
        } : undefined,
      },
      include: {
        days: {
          include: { activities: true },
        },
      },
    });

    res.status(201).json({ data: newVersion });
  } catch (error: any) {
    console.error('Error creating version:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/atlas/:id/versions/:vid
 * Update version content (intro, tips, days with activities).
 * Replaces all days/activities with the provided content.
 */
router.put('/:id/versions/:vid', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const vid = req.params.vid as string;
    const userId = req.user!.id;
    const input: VersionContentInput = req.body;

    // Verify ownership
    const atlasFile = await prisma.atlasFile.findUnique({ where: { id } });
    if (!atlasFile || atlasFile.author_id !== userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const version = await prisma.atlasFileVersion.findUnique({ where: { id: vid } });
    if (!version || version.atlas_file_id !== id) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }
    if (version.status === 'published') {
      res.status(400).json({ error: 'Cannot edit a published version. Create a new draft version instead.' });
      return;
    }

    // Delete existing days (cascade deletes activities)
    await prisma.atlasFileDay.deleteMany({ where: { version_id: vid } });

    // Update version + recreate days
    const updated = await prisma.atlasFileVersion.update({
      where: { id: vid },
      data: {
        intro: input.intro,
        tips: input.tips,
        days: {
          create: (input.days || []).map(day => ({
            day_number: day.day_number,
            title: day.title,
            content: day.content,
            images: day.images || [],
            activities: {
              create: (day.activities || []).map((act, idx) => ({
                position: act.position ?? idx,
                title: act.title,
                description: act.description,
                location: act.location,
                category: act.category,
                duration_minutes: act.duration_minutes,
                estimated_cost_min: act.estimated_cost_min,
                estimated_cost_max: act.estimated_cost_max,
                latitude: act.latitude,
                longitude: act.longitude,
                time_of_day: act.time_of_day,
              })),
            },
          })),
        },
      },
      include: {
        days: {
          orderBy: { day_number: 'asc' },
          include: { activities: { orderBy: { position: 'asc' } } },
        },
      },
    });

    // Also update the legacy content JSONB for backwards compat
    await prisma.atlasFile.update({
      where: { id },
      data: {
        content: {
          intro: input.intro || '',
          tips: input.tips || '',
          days: (input.days || []).map(d => ({
            dayNumber: d.day_number,
            title: d.title,
            content: d.content || '',
            images: d.images || [],
          })),
        },
      },
    });

    res.json({ data: updated });
  } catch (error: any) {
    console.error('Error updating version:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/atlas/:id/versions/:vid/publish
 * Publish a version. Archives the previously published version.
 */
router.post('/:id/versions/:vid/publish', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const vid = req.params.vid as string;
    const userId = req.user!.id;

    const atlasFile = await prisma.atlasFile.findUnique({ where: { id } });
    if (!atlasFile || atlasFile.author_id !== userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const version = await prisma.atlasFileVersion.findUnique({ where: { id: vid } });
    if (!version || version.atlas_file_id !== id) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }
    if (version.status !== 'draft') {
      res.status(400).json({ error: 'Only draft versions can be published' });
      return;
    }

    // Archive currently published version
    await prisma.atlasFileVersion.updateMany({
      where: { atlas_file_id: id, status: 'published' },
      data: { status: 'archived' },
    });

    // Publish this version
    const now = new Date();
    const published = await prisma.atlasFileVersion.update({
      where: { id: vid },
      data: { status: 'published', published_at: now },
    });

    // Update atlas file — set pending review for moderation
    await prisma.atlasFile.update({
      where: { id },
      data: { published_at: now, moderation_status: 'pending' },
    });

    res.json({ data: published });
  } catch (error: any) {
    console.error('Error publishing version:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// FORKING
// ============================================

/**
 * POST /api/atlas/:id/fork
 * Fork a published atlas file into user's itineraries.
 * Creates a new itinerary + activities from the published version.
 */
router.post('/:id/fork', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // Get atlas file + latest published version
    const atlasFile: any = await prisma.atlasFile.findUnique({
      where: { id },
      include: {
        versions: {
          where: { status: 'published' },
          orderBy: { version_number: 'desc' },
          take: 1,
          include: {
            days: {
              orderBy: { day_number: 'asc' },
              include: {
                activities: { orderBy: { position: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!atlasFile) {
      res.status(404).json({ error: 'Atlas file not found' });
      return;
    }

    const publishedVersion = atlasFile.versions[0];
    if (!publishedVersion) {
      res.status(400).json({ error: 'No published version available to fork' });
      return;
    }

    // Create itinerary via Supabase (respects existing schema + RLS bypass)
    const { data: newItinerary, error: itError } = await supabase
      .from('itineraries')
      .insert({
        user_id: userId,
        title: `${atlasFile.title} (Forked)`,
        destination: atlasFile.destination,
        trip_length: atlasFile.trip_length,
        traveler_profiles: atlasFile.traveler_profiles || [],
        budget: 'medium',
        travel_pace: 'balanced',
      })
      .select()
      .single();

    if (itError || !newItinerary) {
      console.error('Error creating forked itinerary:', itError);
      res.status(500).json({ error: 'Failed to create itinerary' });
      return;
    }

    // Insert activities from all days
    const activitiesToInsert = publishedVersion.days.flatMap((day: any) =>
      day.activities.map((act: any, idx: number) => ({
        itinerary_id: newItinerary.id,
        day_number: day.day_number,
        position: act.position ?? idx,
        title: act.title,
        description: act.description || '',
        location: act.location || '',
        category: act.category || 'other',
        duration_minutes: act.duration_minutes || 60,
        estimated_cost_min: act.estimated_cost_min ? Number(act.estimated_cost_min) : 0,
        estimated_cost_max: act.estimated_cost_max ? Number(act.estimated_cost_max) : 0,
        latitude: act.latitude ? Number(act.latitude) : null,
        longitude: act.longitude ? Number(act.longitude) : null,
        time_of_day: act.time_of_day || 'morning',
      }))
    );

    if (activitiesToInsert.length > 0) {
      const { error: actError } = await supabase.from('activities').insert(activitiesToInsert);
      if (actError) console.error('Error inserting forked activities:', actError);
    }

    // Record the fork
    await prisma.forkedItinerary.create({
      data: {
        user_id: userId,
        source_atlas_file_id: id,
        source_version_number: publishedVersion.version_number,
        itinerary_id: newItinerary.id,
      },
    });

    res.status(201).json({
      data: {
        itinerary_id: newItinerary.id,
        forked_from: { atlas_file_id: id, version_number: publishedVersion.version_number },
      },
    });
  } catch (error: any) {
    console.error('Error forking atlas file:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * GET /api/atlas/admin/all
 * List ALL atlas files (admin only).
 */
router.get('/admin/all', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const atlasFiles = await prisma.atlasFile.findMany({
      orderBy: { updated_at: 'desc' },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1,
          select: { id: true, version_number: true, status: true, published_at: true },
        },
      },
    });

    res.json({ data: atlasFiles });
  } catch (error: any) {
    console.error('Error listing all atlas files (admin):', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
