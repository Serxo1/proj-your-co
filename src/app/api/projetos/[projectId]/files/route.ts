import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const { data: files, error } = await supabase
    .from('files')
    .select(`
      *,
      uploadedBy:user_id(
        id,
        name,
        role,
        is_active,
        client:client_id(id, company)
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar arquivos' }, { status: 500 });
  }
  return NextResponse.json(files);
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    const body = await req.json();
    const { name, url, type, userId } = body;
    if (!name || !url || !type || !userId) {
      console.error("Campos obrigatórios ausentes:", { name, url, type, userId });
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos.' }, { status: 400 });
    }
    const { data: file, error } = await supabase
      .from('files')
      .insert({
        name,
        url,
        type,
        project_id: projectId,
        user_id: userId,
      })
      .select(`*, uploadedBy:user_id(id, name, role, is_active, client:client_id(id, company))`)
      .single();
    if (error) {
      console.error("Erro ao inserir arquivo na tabela files:", error);
      return NextResponse.json({ error: 'Erro ao criar arquivo.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, file });
  } catch (error) {
    console.error("Erro ao criar arquivo (catch):", error);
    return NextResponse.json({ error: 'Erro ao criar arquivo.' }, { status: 500 });
  }
} 