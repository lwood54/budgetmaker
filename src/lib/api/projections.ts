import type { DrizzleClient } from '$lib/server/db';
import {
  projections,
  sections,
  intervals,
  groupItems,
  intervalBalances,
  type PaydownStrategy,
  type GroupItem,
  type IntervalBalance,
} from '$lib/server/db/schema';
import { desc, eq, inArray, and } from 'drizzle-orm';

export const getProjectionsByUserId = async (db: DrizzleClient, userId: string) => {
  return await db
    .select()
    .from(projections)
    .where(eq(projections.userId, userId))
    .orderBy(desc(projections.createdAt));
};

export const getProjectionById = async (db: DrizzleClient, projectionId: string) => {
  const [projectionData, sectionsData] = await Promise.all([
    db.select().from(projections).where(eq(projections.uuid, projectionId)).limit(1),
    db.select().from(sections).where(eq(sections.projectionId, projectionId)),
  ]);

  if (projectionData.length === 0) {
    return null;
  }

  const projection = projectionData[0];
  const sectionIds = sectionsData.map((s) => s.uuid);

  if (sectionIds.length === 0) {
    return {
      ...projection,
      sections: [],
    };
  }

  const intervalsData = await db
    .select()
    .from(intervals)
    .where(inArray(intervals.sectionId, sectionIds));

  // Get group items for all intervals
  // Batch queries to avoid parameter limits (SQLite/D1 limit is typically 999)
  const intervalIds = intervalsData.map((i) => i.uuid);
  const allGroupItems: GroupItem[] = [];
  const BATCH_SIZE = 50; // Safe batch size well under the limit

  if (intervalIds.length > 0) {
    for (let i = 0; i < intervalIds.length; i += BATCH_SIZE) {
      const batch = intervalIds.slice(i, i + BATCH_SIZE);
      const batchItems = await db
        .select()
        .from(groupItems)
        .where(inArray(groupItems.intervalId, batch));
      allGroupItems.push(...batchItems);
    }
  }

  // Get balances for all group items (also batched)
  const groupItemIds = allGroupItems.map((gi) => gi.uuid);
  const allBalances: IntervalBalance[] = [];

  if (groupItemIds.length > 0) {
    for (let i = 0; i < groupItemIds.length; i += BATCH_SIZE) {
      const batch = groupItemIds.slice(i, i + BATCH_SIZE);
      const batchBalances = await db
        .select()
        .from(intervalBalances)
        .where(inArray(intervalBalances.groupItemId, batch));
      allBalances.push(...batchBalances);
    }
  }

  // Organize data hierarchically
  const sectionsWithData = sectionsData.map((section) => {
    const sectionIntervals = intervalsData.filter((i) => i.sectionId === section.uuid);
    const intervalsWithData = sectionIntervals.map((interval) => {
      const intervalGroupItems = allGroupItems.filter((gi) => gi.intervalId === interval.uuid);
      const intervalBalancesData = allBalances.filter((ib) => ib.intervalId === interval.uuid);

      return {
        ...interval,
        groupItems: intervalGroupItems,
        intervalBalances: intervalBalancesData,
      };
    });

    return {
      ...section,
      intervals: intervalsWithData.sort((a, b) => a.sequence - b.sequence),
    };
  });

  return {
    ...projection,
    sections: sectionsWithData.sort((a, b) => a.order - b.order),
  };
};

export const createProjectionWithStructure = async (
  db: DrizzleClient,
  userId: string,
  title: string,
  paydownStrategy: PaydownStrategy,
  startYear: number = new Date().getFullYear(),
) => {
  const projectionId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Create projection
  await db.insert(projections).values({
    uuid: projectionId,
    userId,
    title,
    paydownStrategy,
    createdAt: now,
    updatedAt: now,
  });

  // Create 10 years of sections
  const sectionsToInsert = [];
  for (let i = 0; i < 10; i++) {
    const year = startYear + i;
    const sectionId = crypto.randomUUID();
    sectionsToInsert.push({
      uuid: sectionId,
      projectionId,
      title: year.toString(),
      order: i + 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.insert(sections).values(sectionsToInsert);

  // Get section IDs for interval creation
  const createdSections = await db
    .select()
    .from(sections)
    .where(eq(sections.projectionId, projectionId));

  // Create 12 months (intervals) for each section
  // Insert intervals per section to avoid large batch sizes
  for (const section of createdSections) {
    const intervalsToInsert = [];
    for (let month = 1; month <= 12; month++) {
      intervalsToInsert.push({
        uuid: crypto.randomUUID(),
        sectionId: section.uuid,
        sequence: month,
        createdAt: now,
        updatedAt: now,
      });
    }
    await db.insert(intervals).values(intervalsToInsert);
  }

  return projectionId;
};

export const verifyProjectionOwnership = async (
  db: DrizzleClient,
  projectionId: string,
  userId: string,
): Promise<boolean> => {
  const projection = await db
    .select()
    .from(projections)
    .where(and(eq(projections.uuid, projectionId), eq(projections.userId, userId)))
    .limit(1);

  return projection.length > 0;
};
