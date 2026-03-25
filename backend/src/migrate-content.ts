/**
 * One-time migration script: Convert existing atlas_files JSONB content
 * into the new versioned tables (atlas_file_versions, atlas_file_days, atlas_file_day_activities).
 *
 * Run with: npx tsx src/migrate-content.ts
 */
import 'dotenv/config';
import { PrismaClient, Prisma } from './generated/prisma/client';

const prisma = new PrismaClient();

interface LegacyDay {
  dayNumber?: number;
  day_number?: number;
  title: string;
  content?: string;
  images?: string[];
}

interface LegacyContent {
  intro?: string;
  tips?: string;
  days?: LegacyDay[];
}

async function migrate() {
  console.log('Starting content migration...');

  const atlasFiles: any[] = await prisma.atlasFile.findMany({
    where: { content: { not: Prisma.DbNull } },
    include: {
      versions: { select: { id: true } },
    },
  });

  console.log(`Found ${atlasFiles.length} atlas files with content`);

  let migrated = 0;
  let skipped = 0;

  for (const file of atlasFiles) {
    // Skip if already has versions
    if (file.versions.length > 0) {
      console.log(`  Skipping "${file.title}" — already has ${file.versions.length} version(s)`);
      skipped++;
      continue;
    }

    let content: LegacyContent;
    try {
      content = typeof file.content === 'string' ? JSON.parse(file.content) : (file.content as LegacyContent) || {};
    } catch {
      console.warn(`  Skipping "${file.title}" — invalid JSON content`);
      skipped++;
      continue;
    }

    const days = content.days || [];
    const isPublished = file.published_at !== null;

    console.log(`  Migrating "${file.title}" (${days.length} days, ${isPublished ? 'published' : 'draft'})...`);

    await prisma.atlasFileVersion.create({
      data: {
        atlas_file_id: file.id,
        version_number: 1,
        status: isPublished ? 'published' : 'draft',
        intro: content.intro || null,
        tips: content.tips || null,
        published_at: isPublished ? file.published_at : null,
        days: {
          create: days.map((day, idx) => ({
            day_number: day.dayNumber || day.day_number || idx + 1,
            title: day.title || `Day ${idx + 1}`,
            content: day.content || null,
            images: day.images || [],
          })),
        },
      },
    });

    migrated++;
  }

  console.log(`\nMigration complete: ${migrated} migrated, ${skipped} skipped`);
}

migrate()
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
