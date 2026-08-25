'use client';

import { useState } from 'react';
import { supabase } from '@/lib/superbase';

interface Servicio {
  id: string;
  nombre: string;
  precio: number;
  duracion_minutos: number;
}

interface Props {
  servicios: Servicio[];
  perfilId: string;
  telefonoNegocio: string;
}

export default function FormularioReserva({ servicios, perfilId, telefonoNegocio }: Props) {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [cargando, setCargando] = useState(false);

  // Obtener fecha de hoy en formato YYYY-MM-DD para el atributo min del input date
  const hoy = new Date().toISOString().split('T')[0];

  const handleReservar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioSeleccionado) return;

    setCargando(true);
    const fechaHora = new Date(`${fecha}T${hora}:00`).toISOString();

    // 1. Guardar la cita en Supabase
    const { error } = await supabase.from('citas').insert([
      {
        perfil_id: perfilId,
        servicio_id: servicioSeleccionado.id,
        cliente_nombre: nombre,
        cliente_telefono: telefono,
        fecha_hora: fechaHora,
        estado: 'pendiente',
      },
    ]);

    setCargando(false);

    if (error) {
      alert('Error al agendar la cita: ' + error.message);
      return;
    }

    // 2. Armar mensaje para WhatsApp
    const mensaje =
      `¡Hola! Me gustaría confirmar una cita:\n\n` +
      `💅 *Servicio:* ${servicioSeleccionado.nombre}\n` +
      `👤 *Nombre:* ${nombre}\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `⏰ *Hora:* ${hora}\n` +
      `💰 *Total:* $${servicioSeleccionado.precio.toFixed(2)}`;

    // 3. Formatear número internacional de WhatsApp (Ecuador / +593)
    const numLimpio = telefonoNegocio.replace(/[^0-9]/g, '');
    const numFinal = numLimpio.startsWith('0') ? '593' + numLimpio.slice(1) : numLimpio;
    const urlWhatsApp = `https://wa.me/${numFinal}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');

    // Limpiar formulario y cerrar modal
    setServicioSeleccionado(null);
    setNombre('');
    setTelefono('');
    setFecha('');
    setHora('');
  };

  return (
    <div>
      {/* Lista de Servicios */}
      {servicios.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-400 bg-white rounded-xl border border-gray-100">
          No hay servicios disponibles por el momento.
        </div>
      ) : (
        <div className="space-y-3">
          {servicios.map((s) => (
            <div
              key={s.id}
              className="bg-white p-4 rounded-xl border border-pink-100 shadow-sm flex items-center justify-between gap-3 hover:border-pink-200 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{s.nombre}</p>
                <p className="text-xs text-gray-400">{s.duracion_minutos} minutos</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <p className="font-bold text-pink-600 text-base sm:text-lg">${s.precio.toFixed(2)}</p>
                <button
                  onClick={() => setServicioSeleccionado(s)}
                  className="text-xs bg-pink-500 text-white px-3.5 py-2 rounded-lg hover:bg-pink-600 font-semibold transition-colors whitespace-nowrap active:scale-95"
                >
                  Reservar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmación de Cita */}
      {servicioSeleccionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg text-gray-800 mb-1">Agendar Cita</h3>
            <p className="text-xs text-pink-600 font-medium mb-4">
              {servicioSeleccionado.nombre} — ${servicioSeleccionado.precio.toFixed(2)}
            </p>

            <form onSubmit={handleReservar} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tu Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Maria Lopez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 0991234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    min={hoy}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-pink-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  disabled={cargando}
                  onClick={() => setServicioSeleccionado(null)}
                  className="w-1/2 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-1/2 bg-pink-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors disabled:opacity-50"
                >
                  {cargando ? 'Guardando...' : 'Confirmar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}