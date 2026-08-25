'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/superbase';
import Link from 'next/link';

interface Horario {
  id?: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
  perfil_id?: string;
}

const DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export default function GestionHorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [perfilId, setPerfilId] = useState<string | null>(null);

  const cargarHorarios = async () => {
    setCargando(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCargando(false);
      return;
    }

    let idFinal = session.user.id;
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id')
      .or(`usuario_id.eq.${session.user.id},user_id.eq.${session.user.id},id.eq.${session.user.id}`)
      .maybeSingle();

    if (perfil) {
      idFinal = perfil.id;
    } else {
      const { data: primerPerfil } = await supabase.from('perfiles').select('id').limit(1).maybeSingle();
      if (primerPerfil) idFinal = primerPerfil.id;
    }

    setPerfilId(idFinal);

    // Cargar horarios existentes
    const { data } = await supabase
      .from('horarios_atencion')
      .select('*')
      .eq('perfil_id', idFinal)
      .order('dia_semana', { ascending: true });

    // Estructurar los 7 días (0 a 6)
    const estructuraCompleta = Array.from({ length: 7 }, (_, i) => {
      const existente = data?.find((h) => h.dia_semana === i);
      return (
        existente || {
          dia_semana: i,
          hora_inicio: '09:00',
          hora_fin: '18:00',
          activo: i !== 0, // Domingo inactivo por defecto
          perfil_id: idFinal,
        }
      );
    });

    setHorarios(estructuraCompleta);
    setCargando(false);
  };

  useEffect(() => {
    cargarHorarios();
  }, []);

  const actualizarDia = (diaIndex: number, campo: keyof Horario, valor: any) => {
    setHorarios((prev) =>
      prev.map((item) => (item.dia_semana === diaIndex ? { ...item, [campo]: valor } : item))
    );
  };

  const guardarHorarios = async () => {
    if (!perfilId) return;
    setGuardando(true);

    const datosAGuardar = horarios.map((h) => ({
      perfil_id: perfilId,
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      activo: h.activo,
    }));

    const { error } = await supabase
      .from('horarios_atencion')
      .upsert(datosAGuardar, { onConflict: 'perfil_id,dia_semana' });

    if (!error) {
      alert('¡Horarios guardados con éxito!');
      cargarHorarios();
    } else {
      alert('Error al guardar horarios: ' + error.message);
    }
    setGuardando(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-6 pt-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Horarios de Atención</h1>
          <p className="text-xs text-gray-500">Define tus días de trabajo y rango de horas de disponibilidad</p>
        </div>
        <Link
          href="/admin"
          className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg font-medium text-gray-700 transition-colors"
        >
          ⬅️ Volver a Citas
        </Link>
      </header>

      {cargando ? (
        <p className="text-xs text-gray-500 text-center py-8">Cargando disponibilidad...</p>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          {horarios.map((h) => (
            <div
              key={h.dia_semana}
              className={`flex flex-wrap items-center justify-between p-3 rounded-xl border transition-colors ${
                h.activo ? 'bg-white border-gray-100' : 'bg-gray-50 border-transparent opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 w-32">
                <input
                  type="checkbox"
                  checked={h.activo}
                  onChange={(e) => actualizarDia(h.dia_semana, 'activo', e.target.checked)}
                  className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-800">{DIAS[h.dia_semana]}</span>
              </div>

              {h.activo ? (
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <span className="text-xs text-gray-400">Desde:</span>
                  <input
                    type="time"
                    value={h.hora_inicio}
                    onChange={(e) => actualizarDia(h.dia_semana, 'hora_inicio', e.target.value)}
                    className="border border-gray-200 rounded-lg p-1.5 text-xs focus:outline-pink-500 bg-white"
                  />
                  <span className="text-xs text-gray-400">Hasta:</span>
                  <input
                    type="time"
                    value={h.hora_fin}
                    onChange={(e) => actualizarDia(h.dia_semana, 'hora_fin', e.target.value)}
                    className="border border-gray-200 rounded-lg p-1.5 text-xs focus:outline-pink-500 bg-white"
                  />
                </div>
              ) : (
                <span className="text-xs text-red-400 font-medium">Cerrado / No laborable</span>
              )}
            </div>
          ))}

          <button
            onClick={guardarHorarios}
            disabled={guardando}
            className="w-full mt-4 bg-pink-500 hover:bg-pink-600 text-white py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {guardando ? 'Guardando...' : '💾 Guardar Disponibilidad'}
          </button>
        </div>
      )}
    </main>
  );
}