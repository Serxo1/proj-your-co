"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

function NovoClienteModal({ open, onClose, onSave, loading, clientesExistentes }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  loading: boolean;
  clientesExistentes: any[];
}) {
  const [tab, setTab] = useState("novo");
  const [form, setForm] = useState({
    company: "",
    cnpj: "",
    phone: "",
    address: "",
    userName: "",
    userEmail: "",
    userPassword: "",
    clientId: "",
    search: "",
  });
  const [error, setError] = useState("");

  // Filtra clientes pelo nome digitado
  const clientesFiltrados = clientesExistentes.filter((c) =>
    c.company.toLowerCase().includes(form.search.toLowerCase())
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "novo") {
      if (!form.company || !form.userName || !form.userEmail || !form.userPassword) {
        setError("Preencha todos os campos obrigatórios.");
        return;
      }
    } else {
      if (!form.clientId || !form.userName || !form.userEmail || !form.userPassword) {
        setError("Preencha todos os campos obrigatórios.");
        return;
      }
    }
    setError("");
    await onSave({ ...form, isNovoCliente: tab === "novo" });
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-lg p-8 relative">
        <button className="absolute top-2 right-2 text-xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">{tab === "novo" ? "Novo Cliente" : "Novo Usuário para Cliente Existente"}</h2>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="novo">Novo cliente</TabsTrigger>
            <TabsTrigger value="existente">Cliente existente</TabsTrigger>
          </TabsList>
          <TabsContent value="novo">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Empresa *</label>
                <input name="company" value={form.company} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" required />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block mb-1 font-medium">CNPJ</label>
                  <input name="cnpj" value={form.cnpj} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" />
                </div>
                <div className="flex-1">
                  <label className="block mb-1 font-medium">Telefone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Endereço</label>
                <input name="address" value={form.address} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block mb-1 font-medium">Nome do usuário *</label>
                  <input name="userName" value={form.userName} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" required />
                </div>
                <div className="flex-1">
                  <label className="block mb-1 font-medium">Email do usuário *</label>
                  <input name="userEmail" type="email" value={form.userEmail} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" required />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Senha do usuário *</label>
                <input name="userPassword" type="password" value={form.userPassword} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" required minLength={6} />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button type="submit" variant="default" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="existente">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Selecione o cliente</label>
                <select
                  name="clientId"
                  value={form.clientId}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 bg-background text-foreground"
                  required
                >
                  <option value="">Selecione o cliente</option>
                  {clientesFiltrados.map((c) => (
                    <option key={c.id} value={c.id}>{c.company} ({c.cnpj})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block mb-1 font-medium">Nome do usuário *</label>
                  <input name="userName" value={form.userName} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" required />
                </div>
                <div className="flex-1">
                  <label className="block mb-1 font-medium">Email do usuário *</label>
                  <input name="userEmail" type="email" value={form.userEmail} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" required />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Senha do usuário *</label>
                <input name="userPassword" type="password" value={form.userPassword} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" required minLength={6} />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button type="submit" variant="default" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function fetchClientes() {
    setLoading(true);
    const res = await fetch("/api/clientes");
    const data = await res.json();
    setClientes(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchClientes();
  }, []);

  async function handleSave(novo: any) {
    setSaving(true);
    setFeedback(null);
    try {
      // Buscar o userId do usuário logado
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      let res, dataRes;
      if (novo.isNovoCliente) {
        res = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...novo, userId }),
        });
        dataRes = await res.json();
      } else {
        res = await fetch("/api/clientes/usuario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...novo, userId }),
        });
        dataRes = await res.json();
      }
      if (!res.ok) {
        setFeedback(dataRes.error || "Erro ao cadastrar.");
      } else {
        setFeedback(novo.isNovoCliente ? "Cliente cadastrado com sucesso!" : "Usuário cadastrado com sucesso!");
        setModalOpen(false);
        fetchClientes();
      }
    } catch (e) {
      setFeedback("Erro ao cadastrar.");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  }

  return (
    <div className="space-y-8">
      <NovoClienteModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} loading={saving} clientesExistentes={clientes} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button variant="default" className="flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Novo Cliente
        </Button>
      </div>
      {feedback && <div className={`mb-4 text-center text-sm ${feedback.includes("sucesso") ? "text-green-600" : "text-red-500"}`}>{feedback}</div>}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left">Empresa</th>
                  <th className="px-4 py-2 text-left">CNPJ</th>
                  <th className="px-4 py-2 text-left">Telefone</th>
                  <th className="px-4 py-2 text-left">Endereço</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8">Carregando...</td></tr>
                ) : clientes.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8">Nenhum cliente encontrado.</td></tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-border hover:bg-accent/40">
                      <td className="px-4 py-2 font-medium">{cliente.company}</td>
                      <td className="px-4 py-2">{cliente.cnpj}</td>
                      <td className="px-4 py-2">{cliente.phone}</td>
                      <td className="px-4 py-2">{cliente.address}</td>
                      <td className="px-4 py-2">
                      {cliente.is_active ? (
  <span className="text-green-600 font-semibold">Ativo</span>
) : (
  <span className="text-red-500 font-semibold">Inativo</span>
)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 