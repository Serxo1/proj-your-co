"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Administrativo</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo, {user?.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Painel de controle administrativo</p>
          </CardContent>
        </Card>
        {/* Adicione mais cards conforme necessário */}
      </div>
    </div>
  );
} 