export type MedicalValue = {
  test: string;
  value: string;
  unit: string;
  normal_range: string;
  status: 'normal' | 'high' | 'low' | 'unknown';
};

type TestPattern = {
  test: string;
  patterns: RegExp[];
  unit: string;
  normal: string;
  high: number;
  low: number;
};

const KNOWN_TESTS: TestPattern[] = [
  { test: 'Blood Sugar (Fasting)', patterns: [/(?:blood\s+sugar|glucose|fasting\s+(?:blood\s+)?sugar|fbs|fbg)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '70–100', high: 100, low: 70 },
  { test: 'Blood Sugar (PP/RBS)', patterns: [/(?:post\s*prandial|pp\s*glucose|pbg|rbs|random\s+blood\s+sugar)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '<140', high: 140, low: 0 },
  { test: 'HbA1c', patterns: [/(?:hba1c|hb\s*a1c|glycated\s+hemoglobin|glyco?sylated|a1c)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: '%', normal: '<5.7', high: 5.7, low: 0 },
  { test: 'Total Cholesterol', patterns: [/(?:total\s+cholesterol|cholesterol[\s,]+total|serum\s+cholesterol)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '<200', high: 200, low: 0 },
  { test: 'HDL Cholesterol', patterns: [/(?:hdl[\s\-]+cholesterol|hdl|high\s+density\s+lipoprotein)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '>40', high: 9999, low: 40 },
  { test: 'LDL Cholesterol', patterns: [/(?:ldl[\s\-]+cholesterol|ldl|low\s+density\s+lipoprotein)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '<100', high: 100, low: 0 },
  { test: 'Triglycerides', patterns: [/(?:triglycerides?|tg|serum\s+triglycerides?)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '<150', high: 150, low: 0 },
  { test: 'Hemoglobin', patterns: [/(?:hemoglobin|haemoglobin|hb|hgb)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'g/dL', normal: '12–17', high: 17, low: 12 },
  { test: 'TSH', patterns: [/(?:tsh|thyroid\s+stimulating\s+hormone)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mIU/L', normal: '0.4–4.0', high: 4.0, low: 0.4 },
  { test: 'T3 (Total)', patterns: [/(?:t3\s*[\(\-]?total|total\s*t3|triiodothyronine)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'ng/dL', normal: '80–200', high: 200, low: 80 },
  { test: 'T4 (Total)', patterns: [/(?:t4\s*[\(\-]?total|total\s*t4|thyroxine)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mcg/dL', normal: '5.1–14.1', high: 14.1, low: 5.1 },
  { test: 'Creatinine', patterns: [/(?:creatinine|serum\s+creatinine|s\.?\s*creatinine)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '0.7–1.3', high: 1.3, low: 0.7 },
  { test: 'Blood Urea', patterns: [/(?:blood\s+urea|serum\s+urea|urea)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '15–45', high: 45, low: 15 },
  { test: 'Uric Acid', patterns: [/(?:uric\s+acid|serum\s+uric\s+acid)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mg/dL', normal: '3.5–7.2', high: 7.2, low: 3.5 },
  { test: 'SGPT / ALT', patterns: [/(?:sgpt|alt|alanine\s+(?:amino)?transferase)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'U/L', normal: '7–56', high: 56, low: 7 },
  { test: 'SGOT / AST', patterns: [/(?:sgot|ast|aspartate\s+(?:amino)?transferase)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'U/L', normal: '10–40', high: 40, low: 10 },
  { test: 'Sodium', patterns: [/(?:sodium|serum\s+sodium)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mEq/L', normal: '136–145', high: 145, low: 136 },
  { test: 'Potassium', patterns: [/(?:potassium|serum\s+potassium)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'mEq/L', normal: '3.5–5.1', high: 5.1, low: 3.5 },
  { test: 'Systolic BP', patterns: [/(?:systolic|sbp)\s*[:\-]?\s*(\d+)/gi], unit: 'mmHg', normal: '<120', high: 120, low: 0 },
  { test: 'Diastolic BP', patterns: [/(?:diastolic|dbp)\s*[:\-]?\s*(\d+)/gi], unit: 'mmHg', normal: '<80', high: 80, low: 0 },
  { test: 'WBC Count', patterns: [/(?:wbc|white\s+blood\s+cell|leucocyte|leukocyte)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'cells/mcL', normal: '4000–11000', high: 11000, low: 4000 },
  { test: 'Platelets', patterns: [/(?:platelets?|plt|thrombocytes?)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'lakhs/mcL', normal: '1.5–4.5', high: 4.5, low: 1.5 },
  { test: 'Vitamin D', patterns: [/(?:vitamin\s*d|25\s*oh\s*vitamin\s*d|25-oh-d)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'ng/mL', normal: '30–100', high: 100, low: 30 },
  { test: 'Vitamin B12', patterns: [/(?:vitamin\s*b\s*12|b12|cobalamin)\s*[:\-]?\s*(\d+\.?\d*)/gi], unit: 'pg/mL', normal: '200–900', high: 900, low: 200 },
];

function getStatus(value: number, low: number, high: number): 'normal' | 'high' | 'low' {
  if (value > high) return 'high';
  if (value < low && low > 0) return 'low';
  return 'normal';
}

export function extractMedicalValues(text: string): MedicalValue[] {
  const results: MedicalValue[] = [];
  const seen = new Set<string>();
  const normalizedText = text.replace(/\r\n/g, '\n').toLowerCase();

  for (const testDef of KNOWN_TESTS) {
    for (const pattern of testDef.patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(normalizedText);
      if (match && !seen.has(testDef.test)) {
        const numericValue = parseFloat(match[1]);
        seen.add(testDef.test);
        results.push({
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

  return results;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamically import to avoid Next.js bundling issues
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    const { data: { text } } = await worker.recognize(buffer);
    return text;
  } finally {
    await worker.terminate();
  }
}
