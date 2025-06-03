import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminUser } from '@/utils/isAdminUser';

export async function GET() {
  const { data, error } = await supabase.from('clients').select('*').order('company', { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { company, cnpj, phone, address, userName, userEmail, userPassword, userId } = body;
    if (!company || !userName || !userEmail || !userPassword || !userId) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos.' }, { status: 400 });
    }
    if (!(await isAdminUser(userId))) {
      return NextResponse.json({ error: 'Acesso negado. Apenas admin pode criar clientes.' }, { status: 403 });
    }
    // Verifica se já existe usuário com o mesmo email
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', userEmail).single();
    if (existingUser) {
      return NextResponse.json({ error: 'Já existe um usuário com este email.' }, { status: 409 });
    }
    // Cria o usuário no Auth do Supabase (agora usando service key)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
    });
    if (authError || !authUser?.user?.id) {
      return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 });
    }
    // Cria o cliente
    const { data: client, error: clientError } = await supabase.from('clients').insert({
      company,
      cnpj: cnpj || null,
      phone: phone || null,
      address: address || null,
      is_active: true,
    }).select().single();
    if (clientError || !client) {
      return NextResponse.json({ error: 'Erro ao cadastrar cliente.' }, { status: 500 });
    }
    // Cria o usuário na tabela users
    const { error: userError2 } = await supabase.from('users').insert({
      id: authUser.user.id,
      name: userName,
      email: userEmail,
      password: '', // Não armazene senha aqui, só no Auth
      role: 'CLIENT',
      phone: phone || null,
      is_active: true,
      client_id: client.id,
    });
    if (userError2) {
      return NextResponse.json({ error: 'Erro ao cadastrar usuário.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, client });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar cliente.' }, { status: 500 });
  }
} 