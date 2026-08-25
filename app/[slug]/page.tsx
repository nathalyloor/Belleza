import { supabase } from '@/lib/superbase';
import FormularioReserva from './FormularioReserva';

interface Props {
  params: Promise<{ slug: string }> | { slug: string };
}

export default async function PageCliente({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // 1. Intentar obtener el perfil coincidente por slug
  let { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .ilike('slug', slug)
    .maybeSingle();

  // 2. Si no hay perfil por slug, tomamos el primer registro existente como fallback
  if (!perfil) {
    const { data: primerPerfil } = await supabase
      .from('perfiles')
      .select('*')
      .limit(1)
      .maybeSingle();
    perfil = primerPerfil;
  }

  // ID hardcodizado del perfil que vimos en tu tabla de Supabase como resguardo definitivo
  const idPerfilValido = perfil?.id || '45f03e26-9012-47b7-9c63-625091216a69';

  // 3. Consultar los servicios vinculados
  const { data: servicios } = await supabase
    .from('servicios')
    .select('id, nombre, precio, duracion_minutos, activo')
    .or(`perfil_id.eq.${idPerfilValido},perfil_id.is.null`);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-4">
        {/* Encabezado del Perfil */}
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
          perfilId={idPerfilValido}
          telefonoNegocio={perfil?.telefono || ''}
        />
      </div>
    </main>
  );
}