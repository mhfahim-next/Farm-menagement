/** Today's date (YYYY-MM-DD) on the farm's clock (Bangladesh), like the website. */
export function farmToday(at = new Date()) {
  const shifted = new Date(at.getTime() + 6 * 3600_000);
  return shifted.toISOString().slice(0, 10);
}
