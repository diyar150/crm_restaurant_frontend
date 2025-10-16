export function formatDate(dateString) {
  if (!dateString) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  if (dateString.includes('T')) return dateString.split('T')[0];
  return '';
}

export function formatNumberWithCommas(value) {
  if (value === null || value === undefined || value === '') return '';
  const parts = value.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (parts.length === 1) return parts[0];
  if (/^0+$/.test(parts[1])) return parts[0];
  return `${parts[0]}.${parts[1]}`;
}

// Format percent (e.g., 0.15 => 15%)
export function formatPercent(value, fractionDigits = 2) {
  if (value === null || value === undefined || value === '') return '';
  return `${(Number(value) * 100).toFixed(fractionDigits)}%`;
}

export function formatPhone(phone) {
  if (!phone) return '';
  // Example: 07701234567 => 0770 123 4567
  return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
}

export function cleanNumber(value) {
  if (value === '' || value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '');
    return cleaned === '' ? null : Number(cleaned);
  }
  return Number(value);
}
