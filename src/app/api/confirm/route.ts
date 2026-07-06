import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createCalendarEvent } from "@/app/actions/calendar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Falta el ID de la reserva", { status: 400 });
  }

  // Usamos el cliente normal de Supabase (asumiendo que las políticas RLS permiten actualizar el status)
  // Si las RLS están cerradas, se necesitaría la SERVICE_ROLE_KEY.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data, error } = await supabase
      .from("appointments")
      .update({ status: "confirmed" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error al confirmar:", error);
      return new NextResponse("Error interno al confirmar la cita en Supabase", { status: 500 });
    }

    // Si se confirma exitosamente en Supabase, ahora sí agendamos en Google Calendar
    try {
      const calRes = await createCalendarEvent({
        nombre: data.nombre,
        empresa: data.empresa || "",
        email: data.email,
        telefono: data.telefono,
        fecha: data.fecha,
        hora: data.hora,
        capacidad: data.capacidad,
        direccion: data.direccion,
        comuna: data.comuna,
      });
      if (!calRes.success) {
        console.error("Error al agendar en Google Calendar desde /api/confirm:", calRes.error);
      }
    } catch (calError) {
      console.error("Excepción al llamar a createCalendarEvent:", calError);
    }

    // HTML de confirmación exitosa
    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cita Confirmada</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border-top: 5px solid #10b981; }
          .icon { font-size: 60px; margin-bottom: 20px; }
          h1 { color: #0f172a; margin-top: 0; }
          p { color: #475569; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h1>Cita Confirmada</h1>
          <p>La reserva de <strong>${data.nombre}</strong> ha sido validada exitosamente. El cliente ahora verá el estado 'Confirmado' en su panel.</p>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(htmlResponse, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Excepción al confirmar", { status: 500 });
  }
}
