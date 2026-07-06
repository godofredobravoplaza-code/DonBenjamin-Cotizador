"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setWarningMsg("");

    try {
      if (isLogin) {
        // 1. Verificamos el bloqueo antes de intentar
        const checkRes = await fetch("/api/auth-lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "check", email }),
        }).then(res => res.json());

        if (checkRes.locked) {
          throw new Error("LOCKED");
        }

        // 2. Intento de login real
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Si falla, reportamos el fallo para subir el contador
          const failRes = await fetch("/api/auth-lock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "fail", email }),
          }).then(res => res.json());
          
          if (failRes.locked) {
            throw new Error("LOCKED");
          } else if (failRes.attempts === 3) {
            setWarningMsg("Atención: Te quedan 2 intentos antes de bloquear la cuenta por seguridad.");
            throw new Error("Credenciales incorrectas.");
          } else if (failRes.attempts === 4) {
            setWarningMsg("ÚLTIMO INTENTO: Si fallas nuevamente, tu cuenta será bloqueada.");
            throw new Error("Credenciales incorrectas.");
          } else {
            throw new Error("Credenciales incorrectas.");
          }
        }
        
        // Si fue exitoso, limpiamos los intentos
        fetch("/api/auth-lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "success", email }),
        });

        router.push("/");
      } else {
        if (password !== confirmPassword) {
          throw new Error("Las contraseñas no coinciden");
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setErrorMsg("Registro exitoso. Redirigiendo...");
        setTimeout(() => router.push("/"), 2000);
      }
    } catch (error: any) {
      if (error.message === "LOCKED") {
        setErrorMsg("Cuenta bloqueada por 15 minutos debido a múltiples intentos fallidos.");
      } else {
        let errorTexto = error.message;
        if (errorTexto === "Invalid login credentials") {
          errorTexto = "Credenciales incorrectas.";
        } else if (errorTexto === "Email not confirmed") {
          errorTexto = "Debes confirmar tu correo electrónico antes de iniciar sesión.";
        } else if (errorTexto === "User already registered") {
          errorTexto = "Este correo ya está registrado en el sistema.";
        } else if (errorTexto.includes("Password should be at least")) {
          errorTexto = "La contraseña debe tener al menos 6 caracteres.";
        }
        setErrorMsg(errorTexto);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border-t-4 border-cyan">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-navy">
            {isLogin ? "Inicia Sesión" : "Crea tu Cuenta"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg("");
                setWarningMsg("");
                setConfirmPassword(""); // Limpiar al cambiar
              }}
              className="font-medium text-cyan hover:text-navy transition-colors"
            >
              {isLogin ? "Regístrate aquí" : "Inicia sesión aquí"}
            </button>
          </p>
        </div>
        
        {errorMsg && (
          <div className={`p-4 rounded text-sm font-bold ${errorMsg.includes("exitoso") ? "bg-green/10 text-green" : "bg-red-100 text-red-700"}`}>
            {errorMsg}
          </div>
        )}

        {warningMsg && (
          <div className={`p-4 rounded text-sm font-bold ${warningMsg.includes("ÚLTIMO") ? "bg-red-600 text-white animate-pulse" : "bg-yellow-100 text-yellow-800"}`}>
            {warningMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label className="sr-only">Correo electrónico</label>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-cyan focus:border-cyan focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="sr-only">Contraseña</label>
              <input
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 ${isLogin ? 'rounded-b-md' : ''} focus:outline-none focus:ring-cyan focus:border-cyan focus:z-10 sm:text-sm`}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                minLength={6}
              />
            </div>
            {!isLogin && (
              <div>
                <label className="sr-only">Confirmar Contraseña</label>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-cyan focus:border-cyan focus:z-10 sm:text-sm"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
              </div>
            )}
          </div>

          {isLogin && (
            <div className="flex items-center justify-end mt-2">
              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-cyan hover:text-navy transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>
          )}

          <div className={!isLogin ? "mt-6" : "mt-2"}>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-navy hover:bg-cyan focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan transition-colors uppercase tracking-wider"
            >
              {loading ? "Procesando..." : isLogin ? "Ingresar" : "Registrarse"}
            </button>
          </div>
        </form>
        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-navy">
            &larr; Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
