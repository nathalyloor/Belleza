import { supabase } from '@/lib/superbase';
import { notFound } from 'next/navigation';
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from 'react';
import FormularioReserva from './FormularioReserva';


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