import { supabase } from '@/lib/superbase';
import FormularioReserva from './FormularioReserva';

interface Props {
  params: Promise<{ slug: string }> | { slug: string };
}

export default async function PageCliente({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // 1. Obtener el perfil por slug o tomar el primero disponible
  let { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .ilike('slug', slug)
    .maybeSingle();

  if (!perfil) {
    const { data: primerPerfil } = await supabase
      .from('perfiles')
      .select('*')
      .limit(1)
      .maybeSingle();
    perfil = primerPerfil;
  }

  const perfilIdUsar = perfil?.id || '45f03e26-9012-47b7-9c63-625091216a69';

  // 2. Traer los servicios vinculados al perfil
  const { data: servicios } = await supabase
    .from('servicios')
    .select('id, nombre, precio, duracion_minutos, activo')
    .eq('perfil_id', perfilIdUsar);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-4">
        {/* Encabezado */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center font-bold text-2xl mb-3 shadow-inner">
            {perfil?.nombre_negocio ? perfil.nombre_negocio.charAt(0).toUpperCase() : 'J'}
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {perfil?.nombre_negocio || 'Jennifer Nails Studio'}
          </h1>
          <p className="text-xs text-pink-500 font-medium mt-1">📍 Citas y Reservas</p>
        </div>

        <h2 className="text-sm font-bold text-gray-700 mb-4">Servicios Disponibles</h2>

        {/* Formulario de Reserva */}
        <FormularioReserva
          servicios={servicios || []}
          perfilId={perfilIdUsar}
          telefonoNegocio={perfil?.telefono || ''}
        />
      </div>
    </main>
  );
}