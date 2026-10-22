import type { PrismaClient } from "@prisma/client";

import {
  SEEDED_PRODUCT_NAME,
  SEEDED_PRODUCT_SORT_ORDER,
  resolveSeedSettings,
} from "./settings.js";

/**
 * First start only. Existing setting values and a non-empty product list are
 * left alone, so a later process start cannot undo an admin change.
 */
export async function seedDatabase(
  client: PrismaClient,
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  const values = resolveSeedSettings(env);
  await client.$transaction(async (tx) => {
    if ((await tx.product.count()) === 0) {
      await tx.product.create({
        data: {
          name: SEEDED_PRODUCT_NAME,
          is_active: true,
          sort_order: SEEDED_PRODUCT_SORT_ORDER,
        },
      });
    }

    const existing = new Set(
      (await tx.setting.findMany({ select: { key: true } })).map(
        (row) => row.key,
      ),
    );
    const missing = Object.entries(values).filter(
      ([key]) => !existing.has(key),
    );
    if (missing.length > 0) {
      await tx.setting.createMany({
        data: missing.map(([key, value]) => ({ key, value })),
      });
    }
  });
}
