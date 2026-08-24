
import { supabase } from '@/lib/superbase';
import { notFound } from 'next/navigation';

interface Servicio {
  id: string | number;
  nombre: string;
  duracion?: number;
  precio?: number;
}

interface FormularioReservaProps {
  servicios: Servicio[];
  perfilId: string | number;
  telefonoNegocio?: string;
}

function FormularioReserva({ servicios, perfilId, telefonoNegocio }: FormularioReservaProps) {
  return (
    <form className="space-y-3 rounded-xl border border-pink-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="perfilId" value={perfilId} />

      {servicios.length === 0 ? (
        <p className="text-sm text-gray-500">No hay servicios disponibles.</p>
      ) : (
        servicios.map((servicio) => (
          <label
            key={servicio.id}
            className="flex items-center justify-between rounded-lg bg-pink-50 px-3 py-2"
          >
            <span className="font-medium text-gray-700">{servicio.nombre}</span>
            <span className="text-xs text-gray-500">
              {typeof servicio.precio === 'number' ? `€${servicio.precio}` : 'Consultar'}
            </span>
          </label>
        ))
      )}

      {telefonoNegocio ? (
        <p className="text-xs text-gray-500">Contacto: {telefonoNegocio}</p>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-700"
      >
        Reservar cita
      </button>
    </form>
  );
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PaginaPerfil({ params }: Props) {
  const { slug } = await params;

  // Obtener perfil de la manicurista
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!perfil) return notFound();

  // Obtener catálogo de servicios
  const { data: servicios } = await supabase
    .from('servicios')
    .select('*')
    .eq('perfil_id', perfil.id);

  return (
    <main className="min-h-screen bg-pink-50/30 p-4 max-w-md mx-auto">
      <header className="text-center my-6">
        <div className="w-24 h-24 bg-pink-200 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-pink-600 text-3xl shadow-sm">
          {perfil.nombre_negocio.charAt(0)}
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{perfil.nombre_negocio}</h1>
        <p className="text-sm text-gray-500 font-medium">📍 Citas y Reservas</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-700 mb-2">Servicios Disponibles</h2>
        <FormularioReserva
          servicios={servicios || []}
          perfilId={perfil.id}
          telefonoNegocio={perfil.telefono}
        />
      </section>
    </main>
  );
}