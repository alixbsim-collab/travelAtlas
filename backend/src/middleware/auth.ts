import { Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../types';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

/**
 * Validates Bearer token from Authorization header via Supabase Auth.
 * Attaches user to req.user. Returns 401 if invalid/missing.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = user;
  next();
}

/**
 * Requires admin role. Must be used after requireAuth.
 * Checks user_profiles.role via Prisma.
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const profile = await prisma.userProfile.findUnique({
    where: { id: req.user.id },
    select: { role: true },
  });

  if (profile?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  req.userRole = 'admin';
  next();
}

/**
 * Optional auth — attaches user if token present, but doesn't reject if missing.
 */
export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}
