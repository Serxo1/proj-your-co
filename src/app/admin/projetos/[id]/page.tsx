"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../../components/ui/tabs";
import { Input } from "../../../../components/ui/input";
import { Select } from "../../../../components/ui/select";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';

export default function ProjetoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState("tasks");
  const [projeto, setProjeto] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");
  const [taskLoading, setTaskLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]); // Pode ser integrado depois
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileTab, setFileTab] = useState("ALL");

  async function fetchProjeto() {
    const res = await fetch(`/api/projetos`);
    const data = await res.json();
    const found = data.find((p: any) => p.id === id);
    setProjeto(found);
  }
  async function fetchTasks() {
    const res = await fetch(`/api/projetos/${id}/tasks`);
    const data = await res.json();
    setTasks(data);
  }
  async function fetchFiles() {
    const res = await fetch(`/api/projetos/${id}/files`);
    const data = await res.json();
    setFiles(data);
  }

  useEffect(() => {
    if (id) {
      fetchProjeto();
      fetchTasks();
      fetchFiles();
    }
  }, [id]);

  useEffect(() => {
    if (
      tasks.length > 0 &&
      tasks.every((t) => t.status === "COMPLETED") &&
      projeto &&
      projeto.status !== "COMPLETED"
    ) {
      setShowCompleteModal(true);
    }
  }, [tasks, projeto]);

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user?.id) setUserId(data.user.id);
    }
    fetchUser();
  }, []);

  async function handleAddTask() {
    if (!newTask.trim() || !userId) return;
    setTaskLoading(true);
    await fetch(`/api/projetos/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask, userId }),
    });
    setNewTask("");
    fetchTasks();
    setTaskLoading(false);
  }

  async function handleStatusChange(taskId: string, status: string) {
    setTaskLoading(true);
    await fetch(`/api/projetos/${id}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
    fetchTasks();
    setTaskLoading(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  }

  function handleRemoveFile(idx: number) {
    setSelectedFiles(files => files.filter((_, i) => i !== idx));
  }

  function getFileType(file: File): string {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      return "IMAGE";
    } else if (["mp4", "mov", "avi", "webm"].includes(ext || "")) {
      return "VIDEO";
    } else if (
      ["pdf", "doc", "docx", "xls", "xlsx", "txt", "ppt", "pptx", "odt", "ods"].includes(ext || "")
    ) {
      return "DOCUMENT";
    } else {
      return "OTHER";
    }
  }

  function normalizeFileName(name: string): string {
    const ext = name.split('.').pop();
    const base = name.replace(/\.[^/.]+$/, "");
    const normalized = base
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^a-zA-Z0-9]/g, "_") // troca tudo que não for letra/número por _
      .replace(/_+/g, "_") // evita múltiplos underlines
      .replace(/^_+|_+$/g, "") // remove underlines do início/fim
      .toLowerCase();
    return `${normalized}.${ext?.toLowerCase()}`;
  }

  async function handleSendFiles() {
    if (!userId || selectedFiles.length === 0) return;
    setFileLoading(true);
    try {
      for (const file of selectedFiles) {
        const normalized = normalizeFileName(file.name);
        const ext = normalized.split('.').pop();
        const base = normalized.replace(/\.[^/.]+$/, "");
        const uniqueName = `${base}_${uuidv4()}.${ext}`;
        const filePath = `${id}/${uniqueName}`;
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(filePath, file);
        if (uploadError) {
          console.error('Erro ao enviar arquivo:', file.name, uploadError);
          continue;
        }
        const { data: urlData } = supabase.storage
          .from("project-files")
          .getPublicUrl(filePath);
        const fileType = getFileType(file);
        await fetch(`/api/projetos/${id}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: uniqueName,
            url: urlData.publicUrl,
            type: fileType,
            userId: userId,
          }),
        });
      }
      setSelectedFiles([]);
      await fetchFiles();
    } catch (error) {
      console.error('Erro ao enviar arquivos:', error);
    } finally {
      setFileLoading(false);
    }
  }

  async function handleProjectStatusChange(newStatus: string) {
    await fetch(`/api/projetos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id, status: newStatus }),
    });
    fetchProjeto();
  }

  async function handleConfirmComplete() {
    await handleProjectStatusChange("COMPLETED");
    setShowCompleteModal(false);
  }

  function filterFilesByTab(files: any[], tab: string) {
    if (tab === "ALL") return files;
    switch (tab) {
      case "IMAGES":
         return files.filter((f: any) => f.type === "IMAGE");
      case "VIDEOS":
         return files.filter((f: any) => f.type === "VIDEO");
      case "DOCUMENTS":
         return files.filter((f: any) => f.type === "DOCUMENT");
      case "OTHERS":
         return files.filter((f: any) => f.type === "OTHER");
      default:
         return files;
    }
  }

  if (!projeto) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-4 text-sm text-muted-foreground cursor-pointer" onClick={() => router.push("/admin/projetos")}>Projetos / <span className="text-foreground font-medium">{projeto.name}</span></div>
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold flex-1">{projeto.name}</h1>
        <select
          value={projeto.status}
          onChange={e => handleProjectStatusChange(e.target.value)}
          className="border rounded px-2 py-1 bg-background text-foreground text-sm"
        >
          <option value="ONGOING">Em andamento</option>
          <option value="COMPLETED">Concluído</option>
          <option value="PAUSED">Pausado</option>
          <option value="CANCELED">Cancelado</option>
        </select>
      </div>
      <div className="mb-6 text-muted-foreground">{projeto.description}</div>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <div className="mt-4">
            <div className="font-semibold mb-2">Tasks</div>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Add a task"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddTask()}
                disabled={taskLoading}
              />
              <Button onClick={handleAddTask} disabled={taskLoading || !newTask.trim()}>Adicionar</Button>
            </div>
            <div className="overflow-x-auto rounded border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Task</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b">
                      <td className="px-4 py-2">{task.title}</td>
                      <td className="px-4 py-2">
                        <select
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value)}
                          className="border rounded px-2 py-1 bg-background text-foreground"
                          disabled={taskLoading}
                        >
                          <option value="PENDING">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="files">
          <div className="mt-4">
            <div className="font-semibold mb-2">Files</div>
            <input type="file" multiple onChange={handleFileSelect} disabled={fileLoading} />
            {selectedFiles.length > 0 && (
              <div className="my-3">
                <div className="font-medium text-sm mb-2">Arquivos a enviar:</div>
                <ul className="mb-2">
                  {selectedFiles.map((file, idx) => (
                    <li key={file.name + idx} className="flex items-center gap-2 text-xs mb-1">
                      <span className="truncate flex-1">{file.name}</span>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveFile(idx)} type="button">Remover</Button>
                    </li>
                  ))}
                </ul>
                <Button onClick={handleSendFiles} disabled={fileLoading || selectedFiles.length === 0}>Enviar arquivos</Button>
              </div>
            )}
            <div className="mt-4">
              <Tabs value={fileTab} onValueChange={setFileTab} className="mb-2">
                <TabsList>
                  <TabsTrigger value="ALL">Todos</TabsTrigger>
                  <TabsTrigger value="IMAGES">Imagens</TabsTrigger>
                  <TabsTrigger value="VIDEOS">Vídeos</TabsTrigger>
                  <TabsTrigger value="DOCUMENTS">Documentos</TabsTrigger>
                  <TabsTrigger value="OTHERS">Outros</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="col-span-full font-semibold text-sm mb-1">Recebidos do cliente</div>
                {filterFilesByTab(files.filter(f => f.uploadedBy?.role === "CLIENT"), fileTab).length === 0 && (
                  <div className="col-span-full text-xs text-muted-foreground">Nenhum arquivo enviado pelo cliente.</div>
                )}
                {filterFilesByTab(files.filter(f => f.uploadedBy?.role === "CLIENT"), fileTab).map((file: any) => (
                  <Card key={file.id} className="p-2 flex flex-col items-center">
                    {file.type === "IMAGE" ? (
                      <img src={file.url} alt={file.name} style={{ width: "100px", height: "100px", objectFit: "cover" }} />
                    ) : (file.type === "VIDEO" ? (
                      <div className="text-xs text-muted-foreground"> VIDEO </div>
                    ) : (file.type === "DOCUMENT" ? (
                      <div className="text-xs text-muted-foreground"> DOCUMENT </div>
                    ) : (
                      <div className="text-xs text-muted-foreground"> OTHER </div>
                    )))}
                    <div className="text-xs font-medium mb-2 truncate w-full text-center mt-2">{file.name}</div>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">Abrir</a>
                  </Card>
                ))}
                <div className="col-span-full font-semibold text-sm mt-4 mb-1">Enviados pela agência</div>
                {filterFilesByTab(files.filter(f => f.uploadedBy?.role === "ADMIN"), fileTab).length === 0 && (
                  <div className="col-span-full text-xs text-muted-foreground">Nenhum arquivo enviado pela agência.</div>
                )}
                {filterFilesByTab(files.filter(f => f.uploadedBy?.role === "ADMIN"), fileTab).map((file: any) => (
                  <Card key={file.id} className="p-2 flex flex-col items-center">
                    {file.type === "IMAGE" ? (
                      <img src={file.url} alt={file.name} style={{ width: "100px", height: "100px", objectFit: "cover" }} />
                    ) : (file.type === "VIDEO" ? (
                      <div className="text-xs text-muted-foreground"> VIDEO </div>
                    ) : (file.type === "DOCUMENT" ? (
                      <div className="text-xs text-muted-foreground"> DOCUMENT </div>
                    ) : (
                      <div className="text-xs text-muted-foreground"> OTHER </div>
                    )))}
                    <div className="text-xs font-medium mb-2 truncate w-full text-center mt-2">{file.name}</div>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">Abrir</a>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="comments">
          <div className="mt-4">
            <div className="font-semibold mb-2">Comentários</div>
            <div className="mb-2">
              <Input
                placeholder="Escreva um comentário..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                disabled
              />
              <Button className="mt-2" disabled>Enviar</Button>
            </div>
            <div className="text-xs text-muted-foreground">(Funcionalidade de comentários será implementada em breve)</div>
          </div>
        </TabsContent>
      </Tabs>
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-lg shadow-lg p-8 max-w-sm w-full">
            <div className="text-lg font-semibold mb-4">Todas as tasks estão concluídas!</div>
            <div className="mb-6">Deseja marcar o projeto como <span className="font-bold">concluído</span>?</div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCompleteModal(false)}>Não</Button>
              <Button variant="default" onClick={handleConfirmComplete}>Sim, concluir projeto</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 