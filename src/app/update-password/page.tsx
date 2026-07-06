"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Al hacer clic en el link del correo, Supabase establece una sesión automáticamente.
    // Verificamos si existe la sesión antes de permitir el cambio.
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: "error", text: "El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo." });
      }
      setCheckingAuth(false);
    };
    checkUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      setMessage({
        type: "success",
        text: "¡Tu contraseña ha sido actualizada con éxito! Redirigiendo...",
      });
      
      // Redirigir al inicio o dashboard después de actualizar
      setTimeout(() => {
        router.push("/");
      }, 2000);
      
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return <div className="min-h-[80vh] flex items-center justify-center font-mono text-navy text-xl animate-pulse">Verificando enlace...</div>;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border-t-4 border-cyan">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-navy">
            Nueva Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu nueva clave de acceso.
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded text-sm font-bold ${message.type === "success" ? "bg-green/10 text-green" : "bg-red-100 text-red-700"}`}>
            {message.text}
          </div>
        )}

        {message?.type !== "error" || message.text.includes("coinciden") ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label className="sr-only">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-cyan focus:border-cyan focus:z-10 sm:text-sm"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || message?.type === "success"}
                  minLength={6}
                />
              </div>
              <div>
                <label className="sr-only">Confirmar Contraseña</label>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-cyan focus:border-cyan focus:z-10 sm:text-sm"
                  placeholder="Repite nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || message?.type === "success"}
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || message?.type === "success"}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-navy hover:bg-cyan focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan transition-colors uppercase tracking-wider"
              >
                {loading ? "Guardando..." : "Guardar Contraseña"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center mt-4">
            <button onClick={() => router.push("/forgot-password")} className="text-sm font-medium text-cyan hover:text-navy transition-colors">
              Solicitar un nuevo enlace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
