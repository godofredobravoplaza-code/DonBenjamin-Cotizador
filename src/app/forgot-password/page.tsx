"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      
      setMessage({
        type: "success",
        text: "¡Te hemos enviado un correo! Revisa tu bandeja de entrada o la carpeta de spam para restablecer tu contraseña.",
      });
      setEmail("");
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border-t-4 border-cyan">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-navy">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu correo y te enviaremos un enlace seguro para crear una nueva clave.
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded text-sm font-bold ${message.type === "success" ? "bg-green/10 text-green" : "bg-red-100 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-navy mb-2">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-cyan focus:border-cyan sm:text-sm"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-navy hover:bg-cyan focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan transition-colors uppercase tracking-wider"
            >
              {loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <Link href="/login" className="text-sm font-medium text-cyan hover:text-navy transition-colors">
            &larr; Volver al Login
          </Link>
        </div>
      </div>
    </div>
  );
}
