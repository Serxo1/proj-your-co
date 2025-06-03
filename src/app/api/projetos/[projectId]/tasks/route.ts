import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdminUser } from '@/utils/isAdminUser';

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*, user:user_id(id, name, email, role)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar tasks' }, { status: 500 });
  }
  return NextResponse.json(tasks);
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const body = await req.json();
    const { title, description, status, deadline, userId } = body;
    if (!title || !userId) {
      return NextResponse.json({ error: 'Título e usuário são obrigatórios.' }, { status: 400 });
    }
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        status: status || 'PENDING',
        deadline: deadline ? deadline : null,
        project_id: projectId,
        user_id: userId,
      })
      .select('*, user:user_id(id, name, email, role)')
      .single();
    if (error) {
      console.error("Erro ao inserir task (Supabase):", error);
      return NextResponse.json({ error: 'Erro ao criar task.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Erro ao criar task (catch):", error);
    return NextResponse.json({ error: 'Erro ao criar task.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const { taskId, status, title, description, deadline } = await req.json();
    if (!taskId) {
      return NextResponse.json({ error: 'ID da task é obrigatório.' }, { status: 400 });
    }
    const updateData: any = {};
    if (status) updateData.status = status;
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (deadline) updateData.deadline = deadline;
    const { data: updated, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('project_id', projectId)
      .select('*, user:user_id(id, name, email, role)')
      .single();
    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar task.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar task.' }, { status: 500 });
  }
} 