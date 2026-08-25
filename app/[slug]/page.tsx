import { supabase } from '@/lib/superbase';
import FormularioReserva from './FormularioReserva';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    slug: string;
  };
}

export default async function PageCliente({ params }: Props) {
  const { slug } = params;

  // 1. Obtener información del perfil según el slug
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!perfil) {
    notFound();
  }

  // 2. Obtener servicios vinculados al perfil
  // Traemos los servicios del perfil (sin filtrar estrictamente por activo para evitar ocultar filas vacías/null)
  const { data: servicios, error } = await supabase
    .from('servicios')
    .select('id, nombre, precio, duracion_minutos, activo')
    .eq('perfil_id', perfil.id);

  // Filtramos en memoria permitiendo registros donde 'activo' sea true o no esté definido (null/undefined)
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

        {/* Componente Formulario de Reserva */}
        <FormularioReserva
          servicios={serviciosVisibles}
          perfilId={perfil.id}
          telefonoNegocio={perfil.telefono || ''}
        />
      </div>
    </main>
  );
}