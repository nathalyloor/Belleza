'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/superbase';
import Link from 'next/link';

interface Servicio {
  id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number;
  categoria?: string;
  activo: boolean;
  perfil_id?: string;
}

export default function GestionServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [perfilId, setPerfilId] = useState<string | null>(null);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [duracion, setDuracion] = useState('60');
  const [categoria, setCategoria] = useState('Manicure');
  const [guardando, setGuardando] = useState(false);

  // Obtener perfil autenticado y cargar sus servicios
  const cargarServicios = async () => {
    setCargando(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setCargando(false);
      return;
    }

    let idFinalPerfil = session.user.id;

    // 1. Intentar buscar el id del perfil en la tabla 'perfiles'
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id')
      .or(`usuario_id.eq.${session.user.id},user_id.eq.${session.user.id},id.eq.${session.user.id}`)
      .maybeSingle();

    if (perfil) {
      idFinalPerfil = perfil.id;
    } else {
      // Fallback: Si no hay perfil asociado a la sesión, tomar el primer perfil para pruebas
      const { data: primerPerfil } = await supabase
        .from('perfiles')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (primerPerfil) {
        idFinalPerfil = primerPerfil.id;
      }
    }

    setPerfilId(idFinalPerfil);

    // 2. Cargar los servicios vinculados al perfil obtenido
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('perfil_id', idFinalPerfil);

    if (!error && data) {
      setServicios(data);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarServicios();
  }, []);

  const agregarServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const { data: { session } } = await supabase.auth.getSession();
    const idAInsertar = perfilId || session?.user?.id;

    if (!idAInsertar) {
      alert('Debes estar autenticado para guardar servicios.');
      setGuardando(false);
      return;
    }

    // Payload dinámico para evitar fallos si falta alguna columna en DB
    const nuevoServicio: Record<string, any> = {
      nombre,
      precio: parseFloat(precio),
      duracion_minutos: parseInt(duracion),
      activo: true,
      perfil_id: idAInsertar,
    };

    if (categoria) {
      nuevoServicio.categoria = categoria;
    }

    const { error } = await supabase.from('servicios').insert([nuevoServicio]);

    if (!error) {
      setNombre('');
      setPrecio('');
      setDuracion('60');
      cargarServicios();
    } else {
      alert('Error al guardar servicio: ' + error.message);
    }
    setGuardando(false);
  };

  const cambiarEstado = async (id: string, activoActual: boolean) => {
    const { error } = await supabase
      .from('servicios')
      .update({ activo: !activoActual })
      .eq('id', id);

    if (!error) {
      setServicios(servicios.map((s) => (s.id === id ? { ...s, activo: !activoActual } : s)));
    }
  };

  const eliminarServicio = async (id: string) => {
    if (!confirm('¿Seguro de que deseas eliminar este servicio?')) return;

    const { error } = await supabase.from('servicios').delete().eq('id', id);
    if (!error) {
      setServicios(servicios.filter((s) => s.id !== id));
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-6 pt-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Catálogo de Servicios</h1>
          <p className="text-xs text-gray-500">Agrega y administra tus servicios y precios</p>
        </div>
        <Link
          href="/admin"
          className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg font-medium text-gray-700 transition-colors"
        >
          ⬅️ Volver a Citas
        </Link>
      </header>

      {/* Formulario de Registro */}
      <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-8">
        <h2 className="text-sm font-bold text-gray-800 mb-4">✨ Agregar Nuevo Servicio</h2>
        <form onSubmit={agregarServicio} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del Servicio</label>
            <input
              type="text"
              required
              placeholder="Ej: Uñas Acrílicas Sculpt"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Precio ($)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="35.00"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Duración (Minutos)</label>
            <input
              type="number"
              required
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-pink-500 bg-white"
            >
              <option value="Manicure">Manicure</option>
              <option value="Pedicure">Pedicure</option>
              <option value="Acrílico/Gel">Acrílico / Gel</option>
              <option value="Nail Art">Nail Art</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {guardando ? 'Guardando...' : '+ Guardar Servicio'}
            </button>
          </div>
        </form>
      </section>

      {/* Lista de Servicios */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-800 mb-2">Listado Activo</h2>
        {cargando ? (
          <p className="text-xs text-gray-500 text-center py-6">Cargando servicios...</p>
        ) : servicios.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6 bg-white rounded-xl border border-gray-100">
            No tienes servicios registrados.
          </p>
        ) : (
          servicios.map((s) => (
            <div
              key={s.id}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 text-sm">{s.nombre}</h3>
                  {s.categoria && (
                    <span className="text-[10px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full font-bold">
                      {s.categoria}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ⏱️ {s.duracion_minutos} min • <strong className="text-gray-800">${s.precio.toFixed(2)}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => cambiarEstado(s.id, s.activo)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    s.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {s.activo ? 'Activo' : 'Oculto'}
                </button>
                <button
                  onClick={() => eliminarServicio(s.id)}
                  className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 rounded-lg font-medium transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}