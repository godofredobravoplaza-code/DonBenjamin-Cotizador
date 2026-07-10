export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border-t-4 border-cyan text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green/20 p-4">
            <svg className="w-12 h-12 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-navy">
          ¡Correo Confirmado!
        </h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Tu cuenta ha sido activada exitosamente.
        </p>
        <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
          Ya puedes <strong>cerrar esta pestaña</strong> y volver a tu ventana original para iniciar sesión con tus credenciales.
        </div>
      </div>
    </div>
  );
}
