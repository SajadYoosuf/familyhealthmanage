import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractTextFromPdf, extractTextFromImage, extractMedicalValues } from '@/lib/extract';

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
  const memberId = formData.get('member_id') as string;
  const category = formData.get('category') as string;
  const reportDate = formData.get('report_date') as string;

  if (!file || !memberId || !category) {
    return NextResponse.json({ error: 'file, member_id and category are required' }, { status: 400 });
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

  // Extract medical values
  const structuredData = rawText ? extractMedicalValues(rawText) : [];

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

  return NextResponse.json({ record, extracted_count: structuredData.length });
}
