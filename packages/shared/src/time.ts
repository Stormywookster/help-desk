/**
 * Display instants in America/New_York, labeled ET (AC-GEN-02, ARCHITECTURE G19).
 * The zone name stays local so this module does not export DISPLAY_TIMEZONE.
 */

const DISPLAY_ZONE = "America/New_York";

const FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatEventTimeEt(instant: Date): string {
  return `${FORMAT.format(instant)} ET`;
}
