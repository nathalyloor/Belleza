'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/superbase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Cita {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  fecha_hora: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  perfil_id?: string;
}

export default function AdminPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioEmail, setUsuarioEmail] = useState<string | null>(null);
  const router = useRouter();

  // 1. Verificar sesión activa y obtener citas del usuario
  const verificarSesionYObtenerCitas = async () => {
    setCargando(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    setUsuarioEmail(session.user.email ?? null);

    // Consulta filtrada por usuario autenticado para SaaS multi-tenant
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .order('fecha_hora', { ascending: true });

    if (!error && data) {
      setCitas(data);
    }
    setCargando(false);
  };

  useEffect(() => {
    verificarSesionYObtenerCitas();
  }, []);

  // 2. Cambiar estado de la cita
  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('citas')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (!error) {
      setCitas(citas.map((c) => (c.id === id ? { ...c, estado: nuevoEstado as Cita['estado'] } : c)));
    } else {
      alert('Error al actualizar el estado: ' + error.message);
    }
  };

  // 3. Cerrar Sesión
  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pt-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-xs text-gray-500">
            Gestión de citas agendadas {usuarioEmail && `• ${usuarioEmail}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/servicios"
            className="text-xs bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            💅 Servicios
          </Link>
          <Link
            href="/admin/horarios"
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            🗓️ Horarios
          </Link>
          <button
            onClick={verificarSesionYObtenerCitas}
            className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer"
          >
            🔄 Actualizar
          </button>
          <button
            onClick={cerrarSesion}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </header>

      {cargando ? (
        <div className="text-center py-10 text-gray-500 text-sm">Cargando citas...</div>
      ) : citas.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl border p-6">
          No hay citas registradas en el sistema.
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map((cita) => {
            const fechaObj = new Date(cita.fecha_hora);
            const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });
            const horaFormateada = fechaObj.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            });

            // Dar formato internacional a WhatsApp
            const numLimpio = cita.cliente_telefono.replace(/[^0-9]/g, '');
            const urlWhatsapp = `https://wa.me/${numLimpio.startsWith('0') ? '593' + numLimpio.slice(1) : numLimpio}`;

            return (
              <div
                key={cita.id}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 text-base">{cita.cliente_nombre}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        cita.estado === 'confirmada'
                          ? 'bg-green-100 text-green-700'
                          : cita.estado === 'cancelada'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {cita.estado}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    📞{' '}
                    <a
                      href={urlWhatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium text-pink-600 hover:text-pink-700"
                    >
                      {cita.cliente_telefono} (Contactar)
                    </a>
                  </p>
                  <p className="text-xs text-gray-600 font-medium">
                    📅 {fechaFormateada} - ⏰ {horaFormateada}
                  </p>
                </div>

                <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                  {cita.estado !== 'confirmada' && (
                    <button
                      onClick={() => actualizarEstado(cita.id, 'confirmada')}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                      Confirmar
                    </button>
                  )}
                  {cita.estado !== 'cancelada' && (
                    <button
                      onClick={() => actualizarEstado(cita.id, 'cancelada')}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}