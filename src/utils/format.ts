const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const bengaliMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export function toBengaliNumber(val: number | string): string {
  const str = String(val);
  return str.replace(/\d/g, d => bengaliDigits[Number(d)]);
}

export function formatTaka(amount: number, inBengaliDigits: boolean = false): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('en-IN').format(rounded);
  if (inBengaliDigits) {
    return `৳ ${toBengaliNumber(formatted)}`;
  }
  return `৳ ${formatted}`;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatBengaliDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const monthName = bengaliMonths[month] || '';
  return `${toBengaliNumber(day)} ${monthName}, ${toBengaliNumber(year)}`;
}

export function formatShortBengaliDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${toBengaliNumber(parts[2])}/${toBengaliNumber(parts[1])}/${toBengaliNumber(parts[0].slice(2))}`;
}

export function formatBengaliTime(timestamp: number): string {
  const d = new Date(timestamp);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
  hours = hours % 12 || 12;
  return `${toBengaliNumber(hours)}:${toBengaliNumber(minutes)} ${ampm}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  milk: 'তরল / গুঁড়া দুধ',
  tea_leaves: 'চা পাতা',
  sugar: 'চিনি',
  cups: 'ওয়ান-টাইম কাপ ও গ্লাস',
  cigarettes: 'সিগারেট স্টক ক্রয়',
  snacks: 'বিস্কুট / কেক / নাস্তা',
  electricity: 'বিদ্যুৎ বিল',
  salary: 'কর্মচারীর বেতন / হাজিরা',
  rent: 'দোকান ভাড়া',
  gas: 'গ্যাস সিলিন্ডার / জ্বালানি',
  misc: 'অন্যান্য বিবিধ খরচ',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'নগদ',
  credit: 'বাকি',
  bkash: 'বিকাশ / নগদ (মোবাইল)',
};

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  // Add UTF-8 BOM so Excel opens Bengali characters properly
  const bom = '\uFEFF';
  const csvContent =
    bom +
    [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map(row =>
        row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
