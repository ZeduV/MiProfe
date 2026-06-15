import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StarRating from '../components/ui/StarRating';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardDocentePage() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [disp, setDisp] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState({ inicio: '', fin: '' });
  const [edit, setEdit] = useState(false);
  const [bio, setBio] = useState('');
  const [precio, setPrecio] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [me, res] = await Promise.all([api.get('/auth/me'), api.get('/reservas/mis-reservas')]);
      setPerfil(me.data.user.perfil); setBio(me.data.user.perfil?.Biografia || ''); setPrecio(me.data.user.perfil?.PrecioPorHora || '');
      setReservas(res.data);
      if (me.data.user.perfil?.PerfilID) setDisp((await api.get(`/docentes/${me.data.user.perfil.PerfilID}/disponibilidad`)).data);
    } catch {} finally { setLoading(false); }
  };

  const addSlot = async () => {
    if (!slot.inicio || !slot.fin) return toast.error('Completa ambos campos');
    try { await api.post('/docentes/disponibilidad', slot); toast.success('Agregado'); setSlot({ inicio: '', fin: '' }); load(); }
    catch (e) { toast.error(e.response?.data?.error || 'Error'); }
  };

  const delSlot = async (id) => { try { await api.delete(`/docentes/disponibilidad/${id}`); toast.success('Eliminado'); load(); } catch (e) { toast.error('Error'); } };

  const save = async () => {
    try { await api.put('/docentes/perfil', { biografia: bio, precioPorHora: parseFloat(precio) }); toast.success('Guardado'); setEdit(false); load(); }
    catch { toast.error('Error'); }
  };

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;
  const pend = reservas.filter(r => r.EstadoReserva === 'Pendiente').length;
  const conf = reservas.filter(r => r.EstadoReserva === 'Confirmada').length;
  const inp = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-5 anim">
        <h1 className="text-xl font-bold text-slate-800">Mi Panel</h1>
        <p className="text-xs text-slate-400 mt-1">Gestiona tu perfil, horarios y clases</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {[
          { l: 'Calificación', v: perfil?.CalificacionPromedio ? Number(perfil.CalificacionPromedio).toFixed(1) : '—', icon: '⭐', bg: 'bg-amber-50', tx: 'text-amber-700' },
          { l: 'Reseñas', v: perfil?.TotalResenas || 0, icon: '💬', bg: 'bg-blue-50', tx: 'text-blue-700' },
          { l: 'Pendientes', v: pend, icon: '📋', bg: pend > 0 ? 'bg-orange-50' : 'bg-slate-50', tx: pend > 0 ? 'text-orange-700' : 'text-slate-500' },
          { l: 'Confirmadas', v: conf, icon: '✅', bg: 'bg-emerald-50', tx: 'text-emerald-700' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 flex items-center gap-3 anim`} style={{ animationDelay: `${i * 0.04}s` }}>
            <span className="text-lg">{s.icon}</span>
            <div><p className={`text-lg font-bold ${s.tx}`}>{s.v}</p><p className="text-[10px] text-slate-400 font-medium">{s.l}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Perfil */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm anim" style={{ animationDelay: '0.08s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">👤 Mi Perfil</h2>
            <button onClick={() => edit ? save() : setEdit(true)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${edit ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {edit ? '✓ Guardar' : '✏️ Editar'}
            </button>
          </div>
          {edit ? (
            <div className="space-y-3">
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Precio/hora (Bs.)</label><input type="number" value={precio} onChange={e => setPrecio(e.target.value)} className={inp} /></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Biografía</label><textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className={`${inp} resize-none`} /></div>
              <button onClick={() => setEdit(false)} className="text-[11px] text-slate-400 hover:text-slate-600">Cancelar</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div><p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Nombre</p><p className="text-sm text-slate-700 font-medium">{user?.nombreCompleto}</p></div>
              <div><p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Precio/hora</p><p className="text-lg font-bold text-teal-600">Bs. {Number(perfil?.PrecioPorHora || 0).toFixed(0)}</p></div>
              {perfil?.CalificacionPromedio > 0 && <div><p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Calificación</p><StarRating rating={perfil.CalificacionPromedio} /></div>}
              <div><p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Biografía</p><p className="text-xs text-slate-600">{perfil?.Biografia || 'Sin biografía'}</p></div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Materias</p>
                <div className="flex flex-wrap gap-1">{perfil?.materias?.map(m => <span key={m.MateriaID} className="px-2 py-0.5 rounded-md bg-teal-50 text-[10px] font-semibold text-teal-700">{m.NombreMateria}</span>)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Horarios */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm anim" style={{ animationDelay: '0.12s' }}>
          <h2 className="text-base font-bold text-slate-800 mb-4">📅 Mis Horarios</h2>
          <div className="space-y-2 mb-3">
            <div className="grid grid-cols-2 gap-2">
              <input type="datetime-local" value={slot.inicio} onChange={e => setSlot(p=>({...p,inicio:e.target.value}))} className={`${inp} text-xs`} />
              <input type="datetime-local" value={slot.fin} onChange={e => setSlot(p=>({...p,fin:e.target.value}))} className={`${inp} text-xs`} />
            </div>
            <button onClick={addSlot} className="w-full py-2 rounded-xl border-2 border-dashed border-slate-300 text-teal-600 text-xs font-semibold hover:border-teal-400 hover:bg-teal-50 transition-all">+ Agregar</button>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {disp.length === 0 ? <p className="text-center text-xs text-slate-400 py-4">Sin horarios</p> : disp.map(s => (
              <div key={s.DisponibilidadID} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs text-slate-700">{format(new Date(s.FechaHoraInicio), "d MMM, HH:mm", { locale: es })} - {format(new Date(s.FechaHoraFin), 'HH:mm')}</p>
                  <span className={`text-[10px] font-semibold ${s.Estado === 'Disponible' ? 'text-emerald-600' : 'text-amber-600'}`}>{s.Estado}</span>
                </div>
                {s.Estado === 'Disponible' && <button onClick={() => delSlot(s.DisponibilidadID)} className="text-red-400 hover:text-red-600 text-xs px-1.5">✕</button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
