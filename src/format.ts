export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    let d = dateString;
    // If the date string doesn't have a timezone indicator, assume it's UTC (from SQLite)
    if (!d.includes('Z') && !d.includes('+') && !/-\d{2}:?\d{2}$/.test(d)) {
      d = d.replace(' ', 'T') + 'Z';
    }
    return new Date(d).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
    });
  } catch {
    return dateString;
  }
};
