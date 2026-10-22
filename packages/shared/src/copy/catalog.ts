/**
 * Copy catalog keyed by DESIGN screen IDs. Wording is filled later (M1-T02).
 * IDs are the rows in DESIGN §3.2 and §4.2, plus the W-07 dialog IDs.
 */

export const COPY_SCREEN_IDS = [
  "C-00",
  "C-01",
  "C-02",
  "C-03",
  "C-04",
  "C-05",
  "C-06",
  "C-07",
  "C-08",
  "C-09",
  "C-10",
  "C-11",
  "E-01",
  "E-02",
  "E-03",
  "E-04",
  "E-05",
  "E-06",
  "E-07",
  "W-01",
  "W-02",
  "W-03",
  "W-04",
  "W-05",
  "W-06",
  "W-07",
  "W-07a",
  "W-07b",
  "W-07c",
  "W-07d",
  "W-07e",
  "W-07f",
  "W-07g",
  "W-08",
  "W-09",
  "W-10",
  "W-11",
  "W-12",
  "W-13",
  "W-14",
  "W-15",
  "A-01",
  "A-02",
  "A-03",
  "A-04",
  "A-05",
  "S1",
  "S2",
  "S3",
] as const;

export type CopyScreenId = (typeof COPY_SCREEN_IDS)[number];

function emptyCatalog(): { [K in CopyScreenId]: "" } {
  const catalog = {} as { [K in CopyScreenId]: "" };
  for (const id of COPY_SCREEN_IDS) catalog[id] = "";
  return catalog;
}

export const copyCatalog = emptyCatalog();
