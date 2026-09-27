import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const admin = createAdminClient();

  // Verify the requester is authenticated and in a family
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: requester } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  if (!requester) {
    return NextResponse.json({ error: 'You are not in a family' }, { status: 400 });
  }

  const { email, name, relation, password, blood_group, height_cm, weight_kg } = await req.json();

  if (!email || !name || !relation || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }

  // Create the new user account via admin (no email confirmation needed)
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !newUser.user) {
    return NextResponse.json({ error: createError?.message || 'Could not create account' }, { status: 500 });
  }

  // Add them to the same family
  const { error: memberError } = await admin
    .from('family_members')
    .insert({
      family_id: requester.family_id,
      user_id: newUser.user.id,
      name,
      relation,
      ...(blood_group && { blood_group }),
      ...(height_cm && { height_cm }),
      ...(weight_kg && { weight_kg }),
    });

  if (memberError) {
    // Clean up the created auth user if member insert fails
    await admin.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
