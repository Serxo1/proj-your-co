import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../../components/ui/mode-toggle";
import { Home, Users, Settings, BarChart2 } from "lucide-react";

const menu = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <Home size={18} /> },
  { label: "Projetos", href: "/admin/projetos", icon: <BarChart2 size={18} /> },
  { label: "Clientes", href: "/admin/clientes", icon: <Users size={18} /> },
  { label: "Relatórios", href: "/admin/relatorios", icon: <BarChart2 size={18} /> },
  { label: "Configurações", href: "/admin/configuracoes", icon: <Settings size={18} /> },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col py-6 px-4">
        <div className="mb-8 text-2xl font-bold tracking-tight text-primary">Agência Admin</div>
        <nav className="flex-1 space-y-2">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
                // Adicione lógica para active se quiser
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-8">
          <ModeToggle />
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-background/80 backdrop-blur">
          <div className="text-lg font-semibold">Dashboard</div>
          {/* Aqui pode ir o perfil do usuário futuramente */}
        </header>
        <section className="flex-1 p-8 bg-background">{children}</section>
      </main>
    </div>
  );
} 