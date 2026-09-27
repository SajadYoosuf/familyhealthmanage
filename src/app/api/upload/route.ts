import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractTextFromPdf, extractTextFromImage, extractMedicalValues, detectCategory, extractReportDate } from '@/lib/extract';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get uploader's family member record
  const { data: uploader } = await supabase
    .from('family_members')
    .select('id, family_id')
    .eq('user_id', user.id)
    .single();

  if (!uploader) {
    return NextResponse.json({ error: 'Family not set up' }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const memberId = uploader.id;

  if (!file) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const isPdf = file.type === 'application/pdf';
  const fileExt = isPdf ? 'pdf' : file.name.split('.').pop() || 'jpg';
  const storagePath = `${uploader.family_id}/${Date.now()}.${fileExt}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('health-files')
    .upload(storagePath, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from('health-files').getPublicUrl(storagePath);

  // Extract text
  let rawText = '';
  try {
    rawText = isPdf
      ? await extractTextFromPdf(buffer)
      : await extractTextFromImage(buffer);
  } catch (err) {
    console.error('Extraction error:', err);
    rawText = '';
  }

  // Auto-detect category and date from report text
  const category = rawText ? detectCategory(rawText) : 'Other';
  const reportDate = rawText ? extractReportDate(rawText) : null;

  // Extract medical values
  const extraction = rawText ? extractMedicalValues(rawText) : { quantitative: [], qualitative: [] };
  const structuredData = {
    quantitative: extraction.quantitative,
    qualitative: extraction.qualitative,
  };

  const { data: record, error: insertError } = await supabase
    .from('health_records')
    .insert({
      family_id: uploader.family_id,
      member_id: memberId,
      category,
      report_date: reportDate || null,
      raw_text: rawText,
      structured_data: structuredData,
      file_url: publicUrl,
      file_type: isPdf ? 'pdf' : 'image',
      uploaded_by_id: uploader.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const totalExtracted = extraction.quantitative.length + extraction.qualitative.length;
  return NextResponse.json({ record, extracted_count: totalExtracted, raw_text_length: rawText.length });
}
