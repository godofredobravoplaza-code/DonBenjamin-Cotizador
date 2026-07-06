import QuotationForm from "@/components/QuotationForm";

export default function Home() {
  return (
    <div className="min-h-screen font-[family-name:var(--font-sans)] pb-20">
      <main className="max-w-7xl mx-auto p-6 mt-8">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold text-navy mb-4">Cotiza y Agenda tu Servicio</h2>
          <p className="text-slate-600">
            Completa el formulario a continuación para calcular el valor de la limpieza de fosa.
            Al pagar, tu servicio quedará agendado automáticamente.
          </p>
        </div>
        
        <QuotationForm />
      </main>
    </div>
  );
}
