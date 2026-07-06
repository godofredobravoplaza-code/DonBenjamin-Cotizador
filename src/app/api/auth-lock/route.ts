import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Endpoint para manejar la lógica estricta de bloqueos
// Espera peticiones POST con body: { action: 'check' | 'fail' | 'success', email: string }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email } = body;

    if (!email) {
      return NextResponse.json({ error: "Falta el correo" }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      // Si el dev no ha configurado la llave, dejamos pasar (no bloqueamos) para no romper la app en desarrollo
      console.warn("Falta SUPABASE_SERVICE_ROLE_KEY. El bloqueo estricto está desactivado temporalmente.");
      return NextResponse.json({ ok: true, attempts: 0, locked: false });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { persistSession: false } }
    );

    // 1. Buscar si el usuario ya tiene un registro en login_attempts
    const { data: record, error: fetchError } = await supabase
      .from("login_attempts")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    let attempts = record?.attempts || 0;
    let locked_until = record?.locked_until ? new Date(record.locked_until) : null;
    const now = new Date();

    // Revisa si el tiempo de bloqueo ya expiró
    if (locked_until && now > locked_until) {
      attempts = 0;
      locked_until = null;
    }

    const isLocked = locked_until && now < locked_until;

    // ACCIÓN: CHECK (Solo mira cómo está el estado antes de intentar login)
    if (action === "check") {
      return NextResponse.json({
        ok: true,
        locked: isLocked,
        locked_until: locked_until?.toISOString(),
        attempts,
      });
    }

    // ACCIÓN: SUCCESS (Login exitoso, resetear intentos)
    if (action === "success") {
      if (record) {
        await supabase
          .from("login_attempts")
          .update({ attempts: 0, locked_until: null, last_attempt: new Date().toISOString() })
          .eq("email", email.toLowerCase());
      }
      return NextResponse.json({ ok: true });
    }

    // ACCIÓN: FAIL (Contraseña mala)
    if (action === "fail") {
      if (isLocked) {
        // Ya estaba bloqueado, no sumamos más
        return NextResponse.json({ ok: true, locked: true, locked_until: locked_until?.toISOString(), attempts });
      }

      attempts += 1;
      let newLockedUntil = null;
      
      // Si llega a 5 intentos, bloqueamos por 10 minutos (que el frontend dirá 15)
      if (attempts >= 5) {
        newLockedUntil = new Date(now.getTime() + 10 * 60000).toISOString();
      }

      if (record) {
        await supabase
          .from("login_attempts")
          .update({ 
            attempts, 
            locked_until: newLockedUntil, 
            last_attempt: now.toISOString() 
          })
          .eq("email", email.toLowerCase());
      } else {
        await supabase
          .from("login_attempts")
          .insert([{ 
            email: email.toLowerCase(), 
            attempts, 
            locked_until: newLockedUntil, 
            last_attempt: now.toISOString() 
          }]);
      }

      return NextResponse.json({
        ok: true,
        locked: attempts >= 5,
        locked_until: newLockedUntil,
        attempts,
      });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });

  } catch (error) {
    console.error("Error en auth-lock:", error);
    return NextResponse.json({ error: "Error de servidor interno" }, { status: 500 });
  }
}
