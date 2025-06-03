import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminUser } from '@/utils/isAdminUser';

export async function GET() {
  // Busca todos os projetos, incluindo client, tasks e files com informações do usuário
  const { data: projetos, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:client_id(id, company, is_active),
      tasks(*),
      files(*, uploadedBy:user_id(id, name, role, is_active))
    `)
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar projetos' }, { status: 500 });
  }
  return NextResponse.json(projetos);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, status, deadline, clientId, userId } = body;
    if (!name || !clientId || !userId) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos.' }, { status: 400 });
    }
    if (!(await isAdminUser(userId))) {
      return NextResponse.json({ error: 'Acesso negado. Apenas admin pode criar projetos.' }, { status: 403 });
    }
    const { data: projeto, error } = await supabase.from('projects').insert({
      name,
      description,
      status,
      deadline: deadline ? deadline : null,
      client_id: clientId,
    }).select().single();
    if (error) {
      return NextResponse.json({ error: 'Erro ao criar projeto.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, projeto });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar projeto.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { projectId, status, name, description, deadline, clientId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: 'ID do projeto é obrigatório.' }, { status: 400 });
    }
    const updateData: any = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (deadline) updateData.deadline = deadline;
    if (clientId) updateData.client_id = clientId;
    const { data: updated, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select(`
        *,
        client:client_id(id, company, is_active),
        tasks(*),
        files(*, uploadedBy:user_id(id, name, role, is_active))
      `)
      .single();
    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar projeto.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar projeto.' }, { status: 500 });
  }
} 