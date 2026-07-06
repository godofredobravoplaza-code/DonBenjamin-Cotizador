"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { createCalendarEvent, getAvailableSlots } from "@/app/actions/calendar";
import { sendConfirmationEmail } from "@/app/actions/email";
import Link from "next/link";

const PRICES = {
  "1200": 80000,
  "2000": 120000,
  "2500": 160000,
  "3250": 250000,
  "5000": 400000,
};

function isHolidayOrSunday(dateString: string) {
  const date = new Date(dateString + "T12:00:00-04:00");
  if (date.getDay() === 0) return true; // Domingo

  // Feriados fijos en Chile (Mes-Día)
  const fixedHolidays = [
    "01-01", "05-01", "05-21", "07-16", "08-15", 
    "09-18", "09-19", "10-31", "11-01", "12-08", "12-25"
  ];
  const md = dateString.substring(5);
  if (fixedHolidays.includes(md)) return true;

  // Feriados móviles / variables comunes (aprox 2026/2027)
  const mobileHolidays = [
    "2026-04-03", "2026-04-04", // Semana Santa
    "2026-06-22", // Pueblos originarios / San Pedro
    "2026-10-12", // Encuentro dos mundos
  ];
  if (mobileHolidays.includes(dateString)) return true;

  return false;
}

export default function QuotationForm() {
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    fecha: "",
    hora: "",
    capacidad: "",
    direccion: "",
    comuna: "Chillán",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        setFormData((prev) => ({ ...prev, email: session.user.email! }));
      }
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    async function fetchSlots() {
      if (!formData.fecha) {
        setAvailableSlots([]);
        setIsHoliday(false);
        return;
      }

      if (isHolidayOrSunday(formData.fecha)) {
        setIsHoliday(true);
        setAvailableSlots([]);
        setFormData((prev) => ({ ...prev, hora: "" }));
        return;
      }
      
      setIsHoliday(false);
      setIsLoadingSlots(true);
      const res = await getAvailableSlots(formData.fecha);
      if (res.success) {
        setAvailableSlots(res.slots);
        // Si la hora seleccionada ya no está disponible, la limpiamos
        if (formData.hora && !res.slots.includes(formData.hora)) {
          setFormData((prev) => ({ ...prev, hora: "" }));
        }
      } else {
        setAvailableSlots([]);
        setFormData((prev) => ({ ...prev, hora: "" }));
      }
      setIsLoadingSlots(false);
    }
    fetchSlots();
  }, [formData.fecha]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculatedPrice = formData.capacidad ? PRICES[formData.capacidad as keyof typeof PRICES] : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      // Simulación de Pago (2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Guardar en Supabase
      const { data: appointmentData, error } = await supabase.from("appointments").insert([
        {
          user_id: user?.id,
          nombre: formData.nombre,
          empresa: formData.empresa,
          email: formData.email,
          telefono: formData.telefono,
          fecha: formData.fecha,
          hora: formData.hora,
          capacidad: formData.capacidad,
          direccion: formData.direccion,
          comuna: formData.comuna,
          precio: calculatedPrice,
          status: "pending", // Empezamos en pendiente
        },
      ]).select("id").single();

      if (error) {
        throw error;
      }

      // Agendar en Google Calendar (interno)
      const calendarRes = await createCalendarEvent({
        nombre: formData.nombre,
        empresa: formData.empresa,
        email: formData.email,
        telefono: formData.telefono,
        fecha: formData.fecha,
        hora: formData.hora,
        capacidad: formData.capacidad,
        direccion: formData.direccion,
        comuna: formData.comuna,
      });

      // Enviar correo de confirmación real al cliente usando Gmail
      const emailRes = await sendConfirmationEmail({
        id: appointmentData?.id,
        baseUrl: window.location.origin,
        nombre: formData.nombre,
        email: formData.email,
        fecha: formData.fecha,
        hora: formData.hora,
        capacidad: formData.capacidad,
        direccion: formData.direccion,
        comuna: formData.comuna,
        precio: calculatedPrice,
      });

      if (!emailRes.success) {
        console.warn("Falló envío de correo:", emailRes.error);
      }

      setSuccess(true);
      // Reset form
      setFormData({
        nombre: "",
        empresa: "",
        email: "",
        telefono: "",
        fecha: "",
        hora: "",
        capacidad: "",
        direccion: "",
        comuna: "Chillán",
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Ocurrió un error al agendar. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authChecked) {
    return <div className="text-center p-10 font-mono text-navy animate-pulse">Cargando...</div>;
  }

  if (!user) {
    return (
      <div className="bg-white p-10 rounded-lg shadow-xl max-w-xl mx-auto border-t-4 border-cyan text-center">
        <h2 className="text-3xl font-extrabold text-navy mb-4 uppercase tracking-tight">Acceso Requerido</h2>
        <p className="text-slate-600 mb-8">
          Para poder cotizar y agendar nuestros servicios, necesitas crear una cuenta gratuita. 
          Esto nos permite mantener un historial de tus servicios y contactarte de manera más segura.
        </p>
        <Link 
          href="/login" 
          className="inline-block px-8 py-4 bg-navy text-white font-black uppercase tracking-widest hover:bg-cyan transition-colors rounded shadow-lg"
        >
          Iniciar Sesión / Registrarse
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl mx-auto border-t-4 border-cyan relative">
      <h2 className="text-3xl font-extrabold text-navy mb-6 text-center uppercase tracking-tight">
        Agendar Servicio
      </h2>
      
      {success && (
        <div className="mb-6 p-4 bg-green/10 border border-green text-green font-bold rounded">
          ¡Pago simulado con éxito! Tu servicio ha sido agendado y se envió la confirmación al correo del cliente.
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 font-bold rounded">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-navy mb-2">Nombre y Apellido</label>
            <input
              type="text"
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-cyan outline-none rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-navy mb-2">Empresa (Opcional)</label>
            <input
              type="text"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-cyan outline-none rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-navy mb-2">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-cyan outline-none rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-navy mb-2">Teléfono</label>
            <input
              type="tel"
              name="telefono"
              required
              value={formData.telefono}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-cyan outline-none rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-navy mb-2">Fecha y Hora Solicitada</label>
            <div className="flex gap-2">
              <input
                type="date"
                name="fecha"
                required
                min={new Date().toISOString().split("T")[0]}
                value={formData.fecha}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-1/2 p-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-cyan outline-none rounded"
              />
              <select
                name="hora"
                required
                value={formData.hora}
                onChange={handleChange}
                disabled={isSubmitting || isLoadingSlots || availableSlots.length === 0 || isHoliday}
                className="w-1/2 p-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-cyan outline-none rounded"
              >
                <option value="" disabled>
                  {isLoadingSlots
                    ? "Buscando horas..."
                    : isHoliday
                    ? "Cerrado (Domingo/Feriado)"
                    : availableSlots.length === 0 && formData.fecha
                    ? "Día sin disponibilidad"
                    : "Hora..."}
                </option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} hrs
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-navy mb-2">Capacidad de Fosa</label>
            <select
              name="capacidad"
              value={formData.capacidad}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-cyan outline-none rounded"
            >
              <option value="" disabled>Seleccione una capacidad...</option>
              <option value="1200">1.200 LTS</option>
              <option value="2000">2.000 LTS</option>
              <option value="2500">2.500 LTS</option>
              <option value="3250">3.250 LTS</option>
              <option value="5000">5.000 LTS</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-navy mb-2">Dirección</label>
            <input
              type="text"
              name="direccion"
              required
              value={formData.direccion}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-cyan outline-none rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-navy mb-2">Comuna</label>
            <select
              name="comuna"
              value={formData.comuna}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-cyan outline-none rounded"
            >
              <option value="Chillán">Chillán</option>
              <option value="Chillán Viejo">Chillán Viejo</option>
            </select>
          </div>
        </div>

        <div className="mt-8 p-6 bg-navy text-white rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
          {isSubmitting && (
            <div className="absolute inset-0 bg-navy/80 flex items-center justify-center z-10 backdrop-blur-sm">
              <span className="font-mono text-cyan animate-pulse">PROCESANDO PAGO...</span>
            </div>
          )}
          
          <div>
            <p className="text-sm text-cyan font-mono mb-1 uppercase tracking-widest">Total a Pagar</p>
            <p className="text-4xl font-extrabold">${calculatedPrice.toLocaleString("es-CL")}</p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !formData.capacidad || !formData.hora}
            className="w-full sm:w-auto px-8 py-4 bg-green text-white font-black uppercase tracking-widest hover:bg-white hover:text-navy transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Pagar y Agendar
          </button>
        </div>
      </form>
    </div>
  );
}
