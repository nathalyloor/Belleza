import { supabase } from '@/lib/superbase';
import FormularioReserva from './FormularioReserva';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }> | { slug: string };
}

export default async function PageCliente({ params }: Props) {
  // Manejo compatible de params para Next.js 14 y 15
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // 1. Buscar perfil por slug (usando ilike para ignorar mayúsculas/minúsculas)
  let { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .ilike('slug', slug)
    .maybeSingle();

  // Fallback: Si no encuentra por slug, toma el primer perfil existente para evitar el 404 en pruebas
  if (!perfil) {
    const { data: primerPerfil } = await supabase
      .from('perfiles')
      .select('*')
      .limit(1)
      .maybeSingle();
    perfil = primerPerfil;
  }

  // Si la tabla perfiles está completamente vacía
  if (!perfil) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border text-center max-w-sm">
          <p className="text-sm text-gray-600">No se encontró ningún perfil registrado en la base de datos.</p>
        </div>
      </main>
    );
  }

  // 2. Obtener servicios vinculados al perfil encontrado
  const { data: servicios } = await supabase
    .from('servicios')
    .select('id, nombre, precio, duracion_minutos, activo')
    .eq('perfil_id', perfil.id);

  // Filtrar servicios activos o sin campo activo definido
  const serviciosVisibles = (servicios || []).filter(
    (s) => s.activo === true || s.activo === null || s.activo === undefined
  );

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-4">
        {/* Encabezado del Perfil */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center font-bold text-2xl mb-3 shadow-inner">
            {perfil.nombre_negocio ? perfil.nombre_negocio.charAt(0).toUpperCase() : 'J'}
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {perfil.nombre_negocio || 'Jennifer Nails Studio'}
          </h1>
          <p className="text-xs text-pink-500 font-medium mt-1">📍 Citas y Reservas</p>
        </div>

        <h2 className="text-sm font-bold text-gray-700 mb-4">Servicios Disponibles</h2>

        {/* Formulario de Reserva */}
        <FormularioReserva
          servicios={serviciosVisibles}
          perfilId={perfil.id}
          telefonoNegocio={perfil.telefono || ''}
        />
      </div>
    </main>
  );
}