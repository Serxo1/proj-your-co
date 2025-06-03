import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, userName, userEmail, userPassword, phone } = body;
    if (!clientId || !userName || !userEmail || !userPassword) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos.' }, { status: 400 });
    }
    // Verifica se já existe usuário com o mesmo email
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', userEmail).single();
    if (existingUser) {
      return NextResponse.json({ error: 'Já existe um usuário com este email.' }, { status: 409 });
    }
    // Cria o usuário no Auth do Supabase
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
    });
    if (authError || !authUser?.user?.id) {
      return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 });
    }
    // Cria o usuário na tabela users
    const { data: user, error: userError } = await supabase.from('users').insert({
      id: authUser.user.id,
      name: userName,
      email: userEmail,
      password: '', // Não armazene senha aqui, só no Auth
      role: 'CLIENT',
      phone: phone || null,
      is_active: true,
      client_id: clientId,
    }).select().single();
    if (userError) {
      return NextResponse.json({ error: 'Erro ao cadastrar usuário.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar usuário.' }, { status: 500 });
  }
} 