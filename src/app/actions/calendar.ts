"use server";

import { google } from "googleapis";

function getCalendarClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google API credentials");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"],
  });

  return google.calendar({ version: "v3", auth });
}

export async function createCalendarEvent(data: {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  fecha: string;
  hora: string;
  capacidad: string;
  direccion: string;
  detalle_direccion?: string;
  comuna: string;
}) {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "articulosdonbenjamin@gmail.com";
    const calendar = getCalendarClient();

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
        - Detalle Dir: ${data.detalle_direccion || "Ninguno"}
      `,
      start: {
        dateTime: `${data.fecha}T${data.hora}:00`,
        timeZone: "America/Santiago",
      },
      end: {
        dateTime: `${data.fecha}T${String((parseInt(data.hora.split(":")[0]) + 2) % 24).padStart(2, "0")}:${data.hora.split(":")[1]}:00`,
        timeZone: "America/Santiago",
      },
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    return { success: true, eventUrl: response.data.htmlLink };
  } catch (error: any) {
    console.error("Error al crear evento en el calendario:", error);
    return { success: false, error: error.message };
  }
}

export async function getAvailableSlots(fecha: string) {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "articulosdonbenjamin@gmail.com";
    const calendar = getCalendarClient();

    // Consultamos desde las 08:00 hasta las 20:00 del día seleccionado
    const timeMin = `${fecha}T08:00:00-04:00`; // -04:00 es America/Santiago estandar (puede variar por horario de verano, pero para freebusy es aceptable)
    const timeMax = `${fecha}T20:00:00-04:00`;

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin,
        timeMax: timeMax,
        timeZone: "America/Santiago",
        items: [{ id: calendarId }],
      },
    });

    const busySlots = response.data.calendars?.[calendarId]?.busy || [];

    // Definir los bloques base de 2 horas que ofrecemos
    const baseBlocks = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
    const availableSlots: string[] = [];

    // Revisar si cada bloque choca con algún periodo ocupado
    for (const time of baseBlocks) {
      const blockStart = new Date(`${fecha}T${time}:00-04:00`).getTime();
      const blockEnd = blockStart + 2 * 60 * 60 * 1000; // 2 horas de duración

      const isBusy = busySlots.some((busyObj) => {
        if (!busyObj.start || !busyObj.end) return false;
        const busyStart = new Date(busyObj.start).getTime();
        const busyEnd = new Date(busyObj.end).getTime();
        
        // Condición de traslape: inicio del bloque es antes del fin del evento, Y fin del bloque es después del inicio del evento
        return blockStart < busyEnd && blockEnd > busyStart;
      });

      if (!isBusy) {
        availableSlots.push(time);
      }
    }

    return { success: true, slots: availableSlots };
  } catch (error: any) {
    console.error("Error al consultar disponibilidad:", error);
    return { success: false, error: error.message, slots: [] };
  }
}
