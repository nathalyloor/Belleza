'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/superbase';

interface Cita {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  fecha_hora: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
}

export default function AdminPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);

  // Cargar citas desde Supabase
  const obtenerCitas = async () => {
    setCargando(true);
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
    obtenerCitas();
  }, []);

  // Cambiar estado de la cita
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

  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-6 pt-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-xs text-gray-500">Gestión de citas agendadas</p>
        </div>
        <button
          onClick={obtenerCitas}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg font-medium transition-colors"
        >
          🔄 Actualizar
        </button>
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
                    📞 <a href={`https://wa.me/${cita.cliente_telefono.replace(/[^0-9]/g, '')}`} target="_blank" className="underline font-medium text-pink-600">{cita.cliente_telefono}</a>
                  </p>
                  <p className="text-xs text-gray-600 font-medium">
                    📅 {fechaFormateada} - ⏰ {horaFormateada}
                  </p>
                </div>

                <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                  {cita.estado !== 'confirmada' && (
                    <button
                      onClick={() => actualizarEstado(cita.id, 'confirmada')}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Confirmar
                    </button>
                  )}
                  {cita.estado !== 'cancelada' && (
                    <button
                      onClick={() => actualizarEstado(cita.id, 'cancelada')}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
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