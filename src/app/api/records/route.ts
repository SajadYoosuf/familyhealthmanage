import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the user's family
  const { data: member } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return NextResponse.json({ records: [] });
  }

  let query = supabase
    .from('health_records')
    .select(`
      id, category, report_date, structured_data, file_url, file_type, created_at,
      member:member_id (id, name, relation),
      uploaded_by:uploaded_by_id (name)
    `)
    .eq('family_id', member.family_id)
    .order('report_date', { ascending: false });

  const memberId = searchParams.get('member_id');
  const category = searchParams.get('category');
  const month = searchParams.get('month'); // format: "2024-01"

  if (memberId) query = query.eq('member_id', memberId);
  if (category) query = query.eq('category', category);
  if (month) {
    const start = `${month}-01`;
    const [year, mon] = month.split('-').map(Number);
    const end = new Date(year, mon, 0).toISOString().split('T')[0];
    query = query.gte('report_date', start).lte('report_date', end);
  }

  const { data: records, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ records: records || [] });
}
