export function normalizeForFiltering(text: string): string {
  if (!text) return '';
  // 1. Strip non-alphanumeric symbols used for obfuscation: * # - _ . , ٬ / \ | ~ ^ +
  let clean = text.replace(/[*#\-_.,٬/\\|~^+]/g, '');
  // 2. Convert Eastern Arabic / Indic digits (٠-٩) to standard ASCII (0-9)
  clean = clean.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  // 3. Remove excess spaces between numbers (e.g. "0 9 1 2 3 4" -> "091234")
  clean = clean.replace(/(\d)\s+(?=\d)/g, '$1');
  return clean;
}

export const LIBYAN_PHONE_REGEXES = [
  /(?:\+?218[\s.\-]?)?0?9[1245][\s.\-]?\d[\s.\-]?\d{3}[\s.\-]?\d{4}/,
  /09[1245]\d{7}/,
  /2189[1245]\d{7}/,
];

export const FORBIDDEN_KEYWORDS = [
  'واتساب',
  'whatsapp',
  'وتساب',
  'واتس',
  'واتصابلنا',
  'اتصل بي',
  'اتصل بيك',
  'نتصل بيك',
  'كلمني',
  'رن علي',
  'رن عليا',
  'برا',
  'بره',
  'خارج التطبيق',
  'خارج المنصة',
  'تواصل برا',
  'مكانك',
  'تعال مكاني',
  'تعالي لمحلي',
  'عندي مباشرة',
  'رقمي',
  'رقمي هو',
  'خذ رقمي',
  'هذا رقمي',
  'هدا رقمي',
  'تلي',
  'تلغرام',
  'telegram',
  'انستا',
  'instagram',
  'فيسبوك مسنجر',
  'ماسنجر',
  'فايبر',
  'viber',
  'بدون تطبيق',
  'بلاش عمولة',
  'نوفر عليك',
  'أرخص برا',
];

export interface FilterResult {
  isBlocked: boolean;
  detectedPattern?: string;
  userWarning?: string;
}

export function checkDisintermediationFilter(text: string): FilterResult {
  if (!text) return { isBlocked: false };

  const normalized = normalizeForFiltering(text);
  const lowerOriginal = text.toLowerCase();
  const lowerNormalized = normalized.toLowerCase();

  // Check Libyan Phone Numbers (both raw and normalized)
  for (const regex of LIBYAN_PHONE_REGEXES) {
    if (regex.test(normalized) || regex.test(text)) {
      return {
        isBlocked: true,
        detectedPattern: 'رقم هاتف ليبي موهّم أو صريح (Libyan Phone Number)',
        userWarning: 'لا يُسمح بمشاركة أرقام الهاتف أو التواصل خارج المنصة. هذا يخالف سياسة البيع ويعرّض الحساب للحظر.',
      };
    }
  }

  // Check Suspicious Keywords
  for (const kw of FORBIDDEN_KEYWORDS) {
    if (lowerOriginal.includes(kw) || lowerNormalized.includes(kw)) {
      return {
        isBlocked: true,
        detectedPattern: `كلمة/عبارة حظر تجاري (${kw})`,
        userWarning: 'لا يُسمح بمشاركة وسائل التواصل الخارجية أو الاتفاقات التجارية خارج المنصة. هذا يخالف سياسة البيع.',
      };
    }
  }

  return { isBlocked: false };
}
