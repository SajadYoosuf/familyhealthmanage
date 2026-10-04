import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { member_id, name, relation, blood_group, height_cm, weight_kg } = await req.json();
  if (!member_id || !name || !relation) {
    return NextResponse.json({ error: 'member_id, name and relation required' }, { status: 400 });
  }

  // Verify the requesting user is in the same family as the member being edited
  const { data: requester } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  if (!requester) {
    return NextResponse.json({ error: 'You are not in a family' }, { status: 400 });
  }

  const { error } = await supabase
    .from('family_members')
    .update({
      name,
      relation,
      blood_group: blood_group || null,
      height_cm: height_cm ? parseFloat(height_cm) : null,
      weight_kg: weight_kg ? parseFloat(weight_kg) : null,
    })
    .eq('id', member_id)
    .eq('family_id', requester.family_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
