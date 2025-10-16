// Get today's date in ISO format (YYYY-MM-DD)
export function getToday() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

// Add days to a date
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Subtract days from a date
export function subtractDays(date, days) {
  return addDays(date, -days);
}

// Get the first day of the month for a given date
export function getMonthStart(date) {
  const d = new Date(date);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

// Get the last day of the month for a given date
export function getMonthEnd(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

// Compare two dates (returns -1, 0, 1)
export function compareDates(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}