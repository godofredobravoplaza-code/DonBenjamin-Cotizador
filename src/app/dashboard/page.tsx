"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Appointment = {
  id: string;
  fecha: string;
  hora: string;
  capacidad: string;
  direccion: string;
  comuna: string;
  precio: number;
  status: string;
  created_at: string;
};

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Obtener reservas del usuario
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", session.user.id)
        .order("fecha", { ascending: false });

      if (!error && data) {
        setAppointments(data);
      }
      setLoading(false);
    }
    
    loadData();
  }, [router]);

  if (loading) {
    return <div className="min-h-[80vh] flex items-center justify-center font-mono text-navy text-xl animate-pulse">Cargando tu información...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Mi Panel de Cliente</h1>
          <p className="text-slate-600 mt-2">Historial de servicios y reservas de {user?.email}</p>
        </div>
        <Link 
          href="/" 
          className="mt-4 md:mt-0 px-6 py-3 bg-cyan text-navy font-bold rounded shadow hover:bg-navy hover:text-white transition-colors"
        >
          Agendar Nuevo Servicio
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-xl overflow-hidden border-t-4 border-navy">
        {appointments.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-navy mb-2">No tienes servicios agendados</h3>
            <p className="text-slate-500 mb-6">Aún no has solicitado ninguna limpieza de fosa.</p>
            <Link href="/" className="text-cyan font-bold hover:underline">Cotizar y agendar ahora</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-navy uppercase text-xs tracking-wider border-b border-slate-200">
                  <th className="p-4 font-bold">Fecha / Hora</th>
                  <th className="p-4 font-bold">Dirección</th>
                  <th className="p-4 font-bold">Capacidad</th>
                  <th className="p-4 font-bold">Total</th>
                  <th className="p-4 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-navy">{appt.fecha}</div>
                      <div className="text-sm text-slate-500">{appt.hora} hrs</div>
                    </td>
                    <td className="p-4 text-sm text-slate-700">
                      {appt.direccion}, {appt.comuna}
                    </td>
                    <td className="p-4 text-sm font-mono text-cyan font-bold">
                      {appt.capacidad} LTS
                    </td>
                    <td className="p-4 font-bold text-navy">
                      ${appt.precio.toLocaleString("es-CL")}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-widest ${
                        appt.status === "paid" ? "bg-green/10 text-green" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {appt.status === "paid" ? "Pagado" : appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
