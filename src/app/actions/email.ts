"use server";

import nodemailer from "nodemailer";

export async function sendConfirmationEmail(data: {
  nombre: string;
  email: string;
  fecha: string;
  hora: string;
  capacidad: string;
  direccion: string;
  comuna: string;
  precio: number;
}) {
  try {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      console.warn("No hay credenciales de Gmail configuradas en el servidor.");
      return { success: false, error: "Missing Gmail credentials" };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });

    const formattedPrice = new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(data.precio);

    const mailOptions = {
      from: `"Don Benjamín" <${user}>`,
      to: data.email,
      subject: `Confirmación de Reserva Limpiafosas - ${data.fecha} ${data.hora}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0B2447; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Don Benjamín</h1>
            <p style="color: #61C0BF; margin: 5px 0 0 0;">Servicios Especializados</p>
          </div>
          
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #0B2447; margin-top: 0;">¡Hola ${data.nombre}!</h2>
            <p style="color: #333333; line-height: 1.6;">
              Hemos recibido tu solicitud de reserva exitosamente. A continuación te presentamos los detalles de tu servicio:
            </p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #61C0BF;">
              <h3 style="margin-top: 0; color: #0B2447;">Detalles de la Reserva</h3>
              <ul style="list-style: none; padding: 0; margin: 0; color: #333333;">
                <li style="margin-bottom: 10px;"><strong>📅 Fecha y Hora:</strong> ${data.fecha} a las ${data.hora} hrs.</li>
                <li style="margin-bottom: 10px;"><strong>💧 Capacidad:</strong> ${data.capacidad} LTS</li>
                <li style="margin-bottom: 10px;"><strong>📍 Dirección:</strong> ${data.direccion}, ${data.comuna}</li>
                <li style="margin-bottom: 10px;"><strong>💰 Total a Pagar:</strong> ${formattedPrice}</li>
              </ul>
            </div>
            
            <p style="color: #333333; line-height: 1.6;">
              Nos pondremos en contacto contigo pronto para coordinar el horario exacto del servicio en la fecha solicitada.
            </p>
            
            <p style="color: #333333; line-height: 1.6; font-weight: bold;">
              ¡Gracias por preferir nuestros servicios!
            </p>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            © ${new Date().getFullYear()} Don Benjamín Ltda. Todos los derechos reservados.
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado:", info.messageId);

    return { success: true };
  } catch (error: any) {
    console.error("Error al enviar correo:", error);
    return { success: false, error: error.message };
  }
}
