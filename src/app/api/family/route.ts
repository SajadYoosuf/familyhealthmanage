import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // Auth check only — DB writes use admin to avoid RLS bootstrap issue
  // (get_my_family_id() returns NULL for brand-new users, blocking INSERT)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { name, relation, familyMode, familyName, inviteCode } = await req.json();

  if (!name || !relation) {
    return NextResponse.json({ error: 'Name and relation are required' }, { status: 400 });
  }

  let familyId: string;

  if (familyMode === 'create') {
    if (!familyName) return NextResponse.json({ error: 'Family name is required' }, { status: 400 });

    const { data: family, error } = await admin
      .from('families')
      .insert({ name: familyName })
      .select()
      .single();

    if (error || !family) {
      return NextResponse.json({ error: error?.message || 'Could not create family' }, { status: 500 });
    }
    familyId = family.id;

  } else {
    if (!inviteCode) return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });

    const { data: family, error } = await admin
      .from('families')
      .select('id')
      .eq('invite_code', inviteCode.toLowerCase().trim())
      .single();

    if (error || !family) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }
    familyId = family.id;
  }

  const { error: memberError } = await admin
    .from('family_members')
    .insert({ family_id: familyId, user_id: user.id, name, relation });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
