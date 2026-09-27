export type MedicalValue = {
  test: string;
  value: string;
  unit: string;
  normal_range: string;
  status: 'normal' | 'high' | 'low' | 'unknown';
};

export type QualitativeValue = {
  test: string;
  result: string;
  status: 'normal' | 'abnormal' | 'info';
};

export type ExtractionResult = {
  quantitative: MedicalValue[];
  qualitative: QualitativeValue[];
};

type TestPattern = {
  test: string;
  patterns: RegExp[];
  unit: string;
  normal: string;
  high: number;
  low: number;
};

// ─── Quantitative (numeric) tests ────────────────────────────────────────────

const KNOWN_TESTS: TestPattern[] = [
  // Blood Sugar
  { test: 'Random Blood Sugar', patterns: [
    /(?:random\s+blood\s+(?:glucose|sugar)|rbs|casual\s+blood\s+(?:sugar|glucose))\s*[:\-\|]?\s*(\d+\.?\d*)/gi,
    /blood\s+(?:glucose|sugar)\s*[\[\(]?\s*random\s*[\]\)]?\s*[:\-\|]?\s*(\d+\.?\d*)/gi,
  ], unit: 'mg/dL', normal: '<140', high: 140, low: 0 },
  { test: 'Fasting Blood Sugar', patterns: [
    /(?:fasting\s+(?:blood\s+)?(?:sugar|glucose)|fbs|fbg)\s*[:\-\|]?\s*(\d+\.?\d*)/gi,
    /blood\s+(?:glucose|sugar)\s*[\[\(]?\s*fasting\s*[\]\)]?\s*[:\-\|]?\s*(\d+\.?\d*)/gi,
  ], unit: 'mg/dL', normal: '70–100', high: 100, low: 70 },
  { test: 'Post Prandial Sugar', patterns: [/(?:post\s*prandial|pp\s*glucose|pbg|ppbs)\s*[:\-\|]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '<140', high: 140, low: 0 },
  { test: 'Blood Sugar', patterns: [
    /\bblood\s+(?:sugar|glucose)\b\s+(\d{2,3}\.?\d*)/gi,
  ], unit: 'mg/dL', normal: '<140', high: 140, low: 0 },
  { test: 'HbA1c', patterns: [/(?:hba1c|hb\s*a1c|glycated\s+hemoglobin|a1c)\s*[:\-\|]?\s*(\d+\.?\d*)/gi], unit: '%', normal: '<5.7', high: 5.7, low: 0 },

  // CBC — Complete Blood Count
  { test: 'Hemoglobin', patterns: [/(?:hemoglobin|haemoglobin|hb|hgb)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'g/dL', normal: '12–17', high: 17, low: 12 },
  { test: 'RBC Count', patterns: [/(?:rbc\s*count|red\s+blood\s+(?:cell|corpuscle)\s*count)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mill/mcL', normal: '4.5–5.5', high: 5.5, low: 4.5 },
  { test: 'WBC / TLC', patterns: [/(?:wbc|tlc|total\s+leucocyte|leukocyte|white\s+blood\s+cell)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'cells/mcL', normal: '4000–11000', high: 11000, low: 4000 },
  { test: 'Platelets', patterns: [/(?:platelets?|plt|thrombocytes?)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'lakhs/mcL', normal: '1.5–4.5', high: 4.5, low: 1.5 },
  { test: 'PCV / Hematocrit', patterns: [/(?:pcv|hematocrit|haematocrit|packed\s+cell\s+volume)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: '%', normal: '36–50', high: 50, low: 36 },
  { test: 'MCV', patterns: [/\bmcv\b\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'fL', normal: '80–100', high: 100, low: 80 },
  { test: 'MCH', patterns: [/\bmch\b\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'pg', normal: '27–33', high: 33, low: 27 },
  { test: 'MCHC', patterns: [/\bmchc\b\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'g/dL', normal: '31.5–34.5', high: 34.5, low: 31.5 },
  { test: 'Neutrophils', patterns: [/(?:neutrophils?|polymorphs?)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: '%', normal: '40–70', high: 70, low: 40 },
  { test: 'Lymphocytes', patterns: [/(?:lymphocytes?)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: '%', normal: '20–40', high: 40, low: 20 },
  { test: 'Eosinophils', patterns: [/(?:eosinophils?)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: '%', normal: '1–6', high: 6, low: 1 },
  { test: 'ESR', patterns: [/\besr\b\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mm/hr', normal: '<20', high: 20, low: 0 },

  // LFT — Liver Function Test
  { test: 'Total Bilirubin', patterns: [/(?:total\s+bilirubin|bilirubin[\s,]+total)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '0.2–1.2', high: 1.2, low: 0.2 },
  { test: 'Direct Bilirubin', patterns: [/(?:direct\s+bilirubin|bilirubin[\s,]+direct|conjugated\s+bilirubin)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '0–0.3', high: 0.3, low: 0 },
  { test: 'Indirect Bilirubin', patterns: [/(?:indirect\s+bilirubin|bilirubin[\s,]+indirect|unconjugated\s+bilirubin)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '0.1–1.0', high: 1.0, low: 0.1 },
  { test: 'SGPT / ALT', patterns: [/(?:sgpt|alt|alanine\s+(?:amino)?transferase)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'U/L', normal: '7–56', high: 56, low: 7 },
  { test: 'SGOT / AST', patterns: [/(?:sgot|ast|aspartate\s+(?:amino)?transferase)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'U/L', normal: '10–40', high: 40, low: 10 },
  { test: 'ALP', patterns: [/(?:alp|alkaline\s+phosphatase)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'U/L', normal: '44–147', high: 147, low: 44 },
  { test: 'GGT', patterns: [/\bggt\b\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'U/L', normal: '9–48', high: 48, low: 9 },
  { test: 'Total Protein', patterns: [/(?:total\s+protein|serum\s+total\s+protein)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'g/dL', normal: '6–8.3', high: 8.3, low: 6 },
  { test: 'Albumin', patterns: [/(?:albumin|serum\s+albumin)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'g/dL', normal: '3.5–5.0', high: 5.0, low: 3.5 },

  // RFT — Renal Function Test
  { test: 'Creatinine', patterns: [/(?:creatinine|serum\s+creatinine|s\.?\s*creatinine)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '0.7–1.3', high: 1.3, low: 0.7 },
  { test: 'Blood Urea', patterns: [/(?:blood\s+urea|serum\s+urea|urea)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '15–45', high: 45, low: 15 },
  { test: 'Uric Acid', patterns: [/(?:uric\s+acid|serum\s+uric\s+acid)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '3.5–7.2', high: 7.2, low: 3.5 },
  { test: 'Sodium', patterns: [/(?:sodium|serum\s+sodium)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mEq/L', normal: '136–145', high: 145, low: 136 },
  { test: 'Potassium', patterns: [/(?:potassium|serum\s+potassium)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mEq/L', normal: '3.5–5.1', high: 5.1, low: 3.5 },
  { test: 'Chloride', patterns: [/(?:chloride|serum\s+chloride)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mEq/L', normal: '98–107', high: 107, low: 98 },
  { test: 'Calcium', patterns: [/(?:calcium|serum\s+calcium|s\.?\s*calcium)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '8.5–10.5', high: 10.5, low: 8.5 },
  { test: 'eGFR', patterns: [/(?:egfr|estimated\s+gfr|glomerular\s+filtration)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mL/min', normal: '>60', high: 9999, low: 60 },

  // Lipid Profile
  { test: 'Total Cholesterol', patterns: [/(?:total\s+cholesterol|cholesterol[\s,]+total)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '<200', high: 200, low: 0 },
  { test: 'HDL Cholesterol', patterns: [/(?:hdl[\s\-]+cholesterol|hdl)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '>40', high: 9999, low: 40 },
  { test: 'LDL Cholesterol', patterns: [/(?:ldl[\s\-]+cholesterol|ldl)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '<100', high: 100, low: 0 },
  { test: 'Triglycerides', patterns: [/(?:triglycerides?|tg)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '<150', high: 150, low: 0 },

  // Thyroid
  { test: 'TSH', patterns: [/(?:tsh|thyroid\s+stimulating)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mIU/L', normal: '0.4–4.0', high: 4.0, low: 0.4 },
  { test: 'T3', patterns: [/(?:\bt3\b|triiodothyronine)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'ng/dL', normal: '80–200', high: 200, low: 80 },
  { test: 'T4', patterns: [/(?:\bt4\b|thyroxine)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mcg/dL', normal: '5.1–14.1', high: 14.1, low: 5.1 },

  // Vitamins
  { test: 'Vitamin D', patterns: [/(?:vitamin\s*d|25\s*oh\s*vitamin\s*d)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'ng/mL', normal: '30–100', high: 100, low: 30 },
  { test: 'Vitamin B12', patterns: [/(?:vitamin\s*b\s*12|b12|cobalamin)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'pg/mL', normal: '200–900', high: 900, low: 200 },
];

// ─── Qualitative (text result) tests ─────────────────────────────────────────

// Blood group: detect "A+", "B negative", "O positive", "AB+" etc.
const BLOOD_GROUP_PATTERN = /\b(a|b|ab|o)\s*[\+\-]|(a|b|ab|o)\s*(positive|negative|pos|neg)\b/gi;

// Viral markers: Reactive / Non-Reactive / Positive / Negative
const VIRAL_MARKERS: { test: string; patterns: RegExp[] }[] = [
  { test: 'HBsAg (Hepatitis B)', patterns: [/(?:hbsag|hepatitis\s*b\s*surface\s*antigen|hbs\s*ag)\s*[:\-]?\s*(reactive|non[\s\-]*reactive|positive|negative)/gi] },
  { test: 'Anti-HCV (Hepatitis C)', patterns: [/(?:anti[\s\-]*hcv|hepatitis\s*c\s*antibody|hcv\s*antibody)\s*[:\-]?\s*(reactive|non[\s\-]*reactive|positive|negative)/gi] },
  { test: 'HIV 1 & 2', patterns: [/(?:hiv\s*(?:1\s*(?:&|and)\s*2)?|human\s+immunodeficiency)\s*[:\-]?\s*(reactive|non[\s\-]*reactive|positive|negative)/gi] },
  { test: 'VDRL (Syphilis)', patterns: [/(?:vdrl|syphilis)\s*[:\-]?\s*(reactive|non[\s\-]*reactive|positive|negative)/gi] },
  { test: 'HCV', patterns: [/\bhcv\b\s*[:\-]?\s*(reactive|non[\s\-]*reactive|positive|negative)/gi] },
];

function getStatus(value: number, low: number, high: number): 'normal' | 'high' | 'low' {
  if (value > high) return 'high';
  if (value < low && low > 0) return 'low';
  return 'normal';
}

function normalizeResult(result: string): string {
  const r = result.toLowerCase().trim();
  if (r === 'non-reactive' || r === 'nonreactive' || r === 'non reactive') return 'Non-Reactive';
  if (r === 'reactive') return 'Reactive';
  if (r === 'positive' || r === 'pos') return 'Positive';
  if (r === 'negative' || r === 'neg') return 'Negative';
  return result;
}

function viralStatus(result: string): 'normal' | 'abnormal' {
  const r = result.toLowerCase();
  if (r.includes('non') || r.includes('negative') || r.includes('neg')) return 'normal';
  return 'abnormal';
}

export function extractMedicalValues(text: string): ExtractionResult {
  const quantitative: MedicalValue[] = [];
  const qualitative: QualitativeValue[] = [];
  const seen = new Set<string>();
  const normalizedText = text.replace(/\r\n/g, '\n').toLowerCase();

  // Extract numeric values
  for (const testDef of KNOWN_TESTS) {
    for (const pattern of testDef.patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(normalizedText);
      if (match && !seen.has(testDef.test)) {
        const numericValue = parseFloat(match[1]);
        seen.add(testDef.test);
        quantitative.push({
          test: testDef.test,
          value: match[1],
          unit: testDef.unit,
          normal_range: testDef.normal,
          status: isNaN(numericValue) ? 'unknown' : getStatus(numericValue, testDef.low, testDef.high),
        });
        break;
      }
    }
  }

  // Extract blood group
  BLOOD_GROUP_PATTERN.lastIndex = 0;
  const bgMatch = BLOOD_GROUP_PATTERN.exec(text);
  if (bgMatch) {
    const raw = bgMatch[0].replace(/\s+/g, '').toUpperCase()
      .replace('POSITIVE', '+').replace('NEGATIVE', '-')
      .replace('POS', '+').replace('NEG', '-');
    qualitative.push({ test: 'Blood Group', result: raw, status: 'info' });
  }

  // Extract viral markers
  for (const marker of VIRAL_MARKERS) {
    for (const pattern of marker.patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(normalizedText);
      if (match && !seen.has(marker.test)) {
        seen.add(marker.test);
        const result = normalizeResult(match[1]);
        qualitative.push({
          test: marker.test,
          result,
          status: viralStatus(result),
        });
        break;
      }
    }
  }

  return { quantitative, qualitative };
}

export function detectCategory(text: string): string {
  const t = text.toLowerCase();

  if (/hemoglobin|haemoglobin|\bwbc\b|\brbc\b|\bplatelets?\b|pcv|hematocrit|leucocyte|lymphocyte|neutrophil|complete\s+blood\s+count|\bcbc\b/.test(t))
    return 'Complete Blood Count (CBC)';

  if (/bilirubin|sgpt|sgot|\balt\b|\bast\b|alkaline\s+phosphatase|\balp\b|liver\s+function/.test(t))
    return 'Liver Function Test (LFT)';

  if (/creatinine|blood\s+urea|uric\s+acid|renal\s+function|kidney\s+function|\brft\b|\bkft\b/.test(t))
    return 'Renal Function Test (RFT)';

  if (/hbsag|hepatitis|anti.hcv|\bhiv\b|\bvdrl\b|viral\s+marker/.test(t))
    return 'Viral Markers';

  if (/blood\s+group|abo\s+group|rh\s+factor|blood\s+type/.test(t))
    return 'Blood Group';

  if (/cholesterol|triglyceride|\bhdl\b|\bldl\b|lipid\s+profile/.test(t))
    return 'Cholesterol / Lipid Profile';

  if (/blood\s+(?:sugar|glucose)|random\s+blood|fasting\s+(?:blood|sugar)|\bhba1c\b|\brbs\b|\bfbs\b|\bppbs\b|diabet/.test(t))
    return 'Blood Sugar / Diabetes';

  if (/\btsh\b|thyroid|thyroxine/.test(t))
    return 'Thyroid (TSH/T3/T4)';

  if (/vitamin\s*d|vitamin\s*b\s*12|\bb12\b|folate/.test(t))
    return 'Vitamin Profile';

  if (/x.ray|x ray|radiograph|ultrasound|scan|mri|ct\s+scan/.test(t))
    return 'X-Ray / Scan Report';

  if (/tablet|capsule|syrup|prescribed|dosage|mg\s+\d+\s+times/.test(t))
    return 'Prescription';

  return 'Other';
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
};

// Returns YYYY-MM-DD string or null
export function extractReportDate(text: string): string | null {
  // Try labeled dates first (most reliable): "Date: 12/05/2024", "Collection Date: 12-May-2024"
  const labeled = text.match(
    /(?:(?:report|collection|sample|test|examination|collected|tested|date\s+of\s+(?:collection|test|report))\s*[:\-]?\s*)(\d{1,2}[\s\/\-\.]\w+[\s\/\-\.]\d{2,4}|\d{4}[\-\/]\d{2}[\-\/]\d{2})/i
  );
  if (labeled) {
    const parsed = parseDate(labeled[1]);
    if (parsed) return parsed;
  }

  // Fallback: first date-shaped string anywhere in text
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const numeric = text.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
  if (numeric) {
    const [, d, m, y] = numeric;
    return toISO(d, m, y);
  }

  // DD Month YYYY or DD-Month-YYYY
  const textMonth = text.match(/\b(\d{1,2})[\s\-]+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s\-]+(\d{2,4})\b/i);
  if (textMonth) {
    const [, d, mon, y] = textMonth;
    const m = MONTHS[mon.toLowerCase().slice(0, 3)];
    if (m) return toISO(d, m, y);
  }

  return null;
}

function parseDate(str: string): string | null {
  str = str.trim();
  // YYYY-MM-DD
  const iso = str.match(/^(\d{4})[\-\/](\d{2})[\-\/](\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2,'0')}-${iso[3].padStart(2,'0')}`;
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\s\/\-\.](\d{1,2})[\s\/\-\.](\d{2,4})$/);
  if (dmy) return toISO(dmy[1], dmy[2], dmy[3]);
  // DD Month YYYY
  const dtm = str.match(/^(\d{1,2})[\s\-]+(\w+)[\s\-]+(\d{2,4})$/);
  if (dtm) {
    const m = MONTHS[dtm[2].toLowerCase().slice(0, 3)];
    if (m) return toISO(dtm[1], m, dtm[3]);
  }
  return null;
}

function toISO(d: string, m: string, y: string): string | null {
  const day = parseInt(d), month = parseInt(m), year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    langPath: process.cwd(),
    cacheMethod: 'none',
    gzip: false,
  });
  try {
    const { data: { text } } = await worker.recognize(buffer);
    return text;
  } finally {
    await worker.terminate();
  }
}
