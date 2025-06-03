"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function NovoProjetoModal({ open, onClose, onSave, loading, clientes }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  loading: boolean;
  clientes: any[];
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "ONGOING",
    deadline: "",
    clientId: "",
  });
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.clientId) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    setError("");
    const randomImg = `https://source.unsplash.com/400x400/?project,creative,design,office,agency,random&sig=${Math.floor(Math.random()*10000)}`;
    await onSave({ ...form, image: randomImg });
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-lg p-8 relative">
        <button className="absolute top-2 right-2 text-xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Novo Projeto</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Nome do projeto *</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" required />
          </div>
          <div>
            <label className="block mb-1 font-medium">Cliente *</label>
            <select name="clientId" value={form.clientId} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" required>
              <option value="">Selecione o cliente</option>
              {clientes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.company}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Descrição</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" rows={2} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block mb-1 font-medium">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground">
                <option value="ONGOING">Em andamento</option>
                <option value="COMPLETED">Concluído</option>
                <option value="PAUSED">Pausado</option>
                <option value="CANCELED">Cancelado</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">Prazo</label>
              <input name="deadline" type="date" value={form.deadline} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" />
            </div>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" variant="default" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState("Todos");
  const [cliente, setCliente] = useState("Todos");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  async function fetchProjetos() {
    setLoading(true);
    const res = await fetch("/api/projetos");
    const data = await res.json();
    setProjetos(data);
    setLoading(false);
  }
  async function fetchClientes() {
    const res = await fetch("/api/clientes");
    const data = await res.json();
    setClientes(data);
  }

  useEffect(() => {
    fetchProjetos();
    fetchClientes();
  }, []);

  async function handleSave(novo: any) {
    setSaving(true);
    setFeedback(null);
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      if (!userId) {
        setFeedback("Erro ao obter o usuário logado.");
        return;
      }
      const res = await fetch("/api/projetos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...novo, userId }),
      });
      const dataRes = await res.json();
      if (!res.ok) {
        setFeedback(dataRes.error || "Erro ao cadastrar projeto.");
      } else {
        setFeedback("Projeto cadastrado com sucesso!");
        setModalOpen(false);
        fetchProjetos();
      }
    } catch (e) {
      setFeedback("Erro ao cadastrar projeto.");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  }

  const statusOptions = ["Todos", "Em andamento", "Aguardando", "Concluído", "Pausado", "Cancelado"];
  const clienteOptions = ["Todos", ...clientes.map((c: any) => c.company)];

  const projetosFiltrados = projetos.filter((p) =>
    (status === "Todos" || p.status === status || (status === "Em andamento" && p.status === "ONGOING") || (status === "Concluído" && p.status === "COMPLETED") || (status === "Pausado" && p.status === "PAUSED") || (status === "Cancelado" && p.status === "CANCELED")) &&
    (cliente === "Todos" || p.client?.company === cliente) &&
    (p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <NovoProjetoModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} loading={saving} clientes={clientes} />
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Projetos em andamento</h1>
        <div className="flex flex-wrap gap-2 items-end">
          <Button variant="default" onClick={() => setModalOpen(true)}>
            + Novo Projeto
          </Button>
          <div>
            <label className="block text-xs mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-2 py-1 bg-background text-foreground">
              {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Cliente</label>
            <select value={cliente} onChange={e => setCliente(e.target.value)} className="border rounded px-2 py-1 bg-background text-foreground">
              {clienteOptions.map(opt => <option key={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Buscar</label>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar projeto..." className="w-40" />
          </div>
        </div>
      </div>
      {feedback && <div className={`mb-4 text-center text-sm ${feedback.includes("sucesso") ? "text-green-600" : "text-red-500"}`}>{feedback}</div>}
      {/* Grid de cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        {projetosFiltrados.map((p) => (
          <Card
            key={p.id}
            className={`cursor-pointer transition-all p-0 ${selected === p.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSelected(p.id)}
            onDoubleClick={() => router.push(`/admin/projetos/${p.id}`)}
            style={{ minWidth: 0 }}
          >
            <div className="aspect-square rounded-t-md overflow-hidden bg-muted flex items-center justify-center" style={{ height: 90 }}>
              {p.image ? (
                <img src={p.image} alt={p.name} className="object-cover w-full h-full" />
              ) : (
                <span className="text-3xl text-muted-foreground">🖼️</span>
              )}
            </div>
            <CardContent className="p-2">
              <div className={`font-semibold text-xs truncate ${selected === p.id ? "text-primary" : ""}`}>{p.name}</div>
              <div className="text-xs text-muted-foreground truncate">{p.client?.company}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Barras de progresso */}
      <div className="space-y-6">
        {projetosFiltrados.map((p) => (
          <div key={p.id}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">{p.name}</span>
              <span className="text-xs font-mono">{p.tasks && p.tasks.length > 0 ? `${Math.round((p.tasks.filter((t: any) => t.status === "COMPLETED").length / p.tasks.length) * 100)}%` : "0%"}</span>
            </div>
            <Progress value={p.tasks && p.tasks.length > 0 ? Math.round((p.tasks.filter((t: any) => t.status === "COMPLETED").length / p.tasks.length) * 100) : 0} className="h-2 bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
} 