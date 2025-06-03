"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientDashboard() {
  const { data: session } = useSession();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard do Cliente</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo, {session?.user?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Área do cliente</p>
          </CardContent>
        </Card>
        {/* Adicione mais cards conforme necessário */}
      </div>
    </div>
  );
} 