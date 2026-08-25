'use client';

import { useState } from 'react';
import { supabase } from '@/lib/superbase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciales incorrectas: ' + error.message);
      setCargando(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <main className="min-h-screen bg-pink-50/30 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-pink-100">
        <h1 className="text-xl font-bold text-gray-800 text-center mb-1">Acceso Administrativo</h1>
        <p className="text-xs text-gray-500 text-center mb-6">Ingresa para gestionar tu agenda</p>

        {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-pink-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-pink-500"
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-pink-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-pink-600 transition-colors"
          >
            {cargando ? 'Iniciando sesión...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}