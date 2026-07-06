"use server";

import { google } from "googleapis";

export async function createCalendarEvent(data: {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  fecha: string;
  capacidad: string;
  direccion: string;
  comuna: string;
}) {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    // Fix newline escaping if it comes directly from env string
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "articulosdonbenjamin@gmail.com";

    if (!clientEmail || !privateKey) {
      throw new Error("Missing Google API credentials");
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/calendar.events"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary: `Servicio Limpiafosas: ${data.nombre}`,
      description: `
        Detalles del servicio:
        - Cliente: ${data.nombre}
        - Teléfono: ${data.telefono}
        - Correo: ${data.email}
        - Empresa: ${data.empresa || "N/A"}
        - Capacidad: ${data.capacidad} LTS
        - Dirección: ${data.direccion}, ${data.comuna}
      `,
      start: {
        date: data.fecha,
        timeZone: "America/Santiago",
      },
      end: {
        date: data.fecha,
        timeZone: "America/Santiago",
      },
      attendees: data.email ? [{ email: data.email }] : [],
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
      sendUpdates: "all", // Envía correo a los asistentes automáticamente
    });

    return { success: true, eventUrl: response.data.htmlLink };
  } catch (error: any) {
    console.error("Error al crear evento en el calendario:", error);
    return { success: false, error: error.message };
  }
}
