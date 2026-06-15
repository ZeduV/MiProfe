import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import { InteractiveStarRating } from '../components/ui/StarRating';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function MisReservasPage() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCal, setShowCal] = useState(false);
  const [selRes, setSelRes] = useState(null);
  const [punt, setPunt] = useState(7);
  const [coment, setComent] = useState('');
  const [calEnv, setCalEnv] = useState(false);
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => { load(); }, []);
  const load = async () => { try { setReservas((await api.get('/reservas/mis-reservas')).data); } catch {} finally { setLoading(false); } };

  const enviarCal = async () => {
    setCalEnv(true);
    try { await api.post('/calificaciones', { reservaID: selRes.ReservaID, puntuacion: punt, comentario: coment }); toast.success('¡Enviada!'); setShowCal(false); setPunt(7); setComent(''); load(); }
    catch (e) { toast.error(e.response?.data?.error || 'Error'); } finally { setCalEnv(false); }
  };

  const act = async (id, path, msg) => {
    try { await api.put(`/reservas/${id}/${path}`); toast.success(msg); load(); }
    catch (e) { toast.error(e.response?.data?.error || 'Error'); }
  };

  const stColor = { Pendiente: 'bg-amber-50 text-amber-700', Confirmada: 'bg-blue-50 text-blue-700', Completada: 'bg-emerald-50 text-emerald-700', Cancelada: 'bg-red-50 text-red-600' };
  const filtered = filtro === 'todas' ? reservas : reservas.filter(r => r.EstadoReserva === filtro);

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-5 anim">
        <h1 className="text-xl font-bold text-slate-800">Mis Reservas</h1>
        <p className="text-xs text-slate-400 mt-1">Gestiona tus clases agendadas</p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5 anim" style={{ animationDelay: '0.05s' }}>
        {['todas','Pendiente','Confirmada','Completada','Cancelada'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${filtro === f ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
            {f === 'todas' ? 'Todas' : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <span className="text-4xl block mb-3">📋</span>
          <h3 className="text-base font-bold text-slate-700 mb-1">No hay reservas</h3>
          <p className="text-xs text-slate-400 mb-4">{user?.rol === 'Estudiante' ? 'Busca un docente para agendar' : 'Aún no tienes reservas'}</p>
          {user?.rol === 'Estudiante' && <Link to="/buscar" className="inline-block px-5 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 shadow-sm">🔍 Buscar Docentes</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => (
            <div key={r.ReservaID} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm anim" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-800">{r.NombreMateria}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${stColor[r.EstadoReserva]}`}>{r.EstadoReserva}</span>
                  </div>
                  <p className="text-xs text-slate-500">{user?.rol === 'Estudiante' ? `👨‍🏫 ${r.DocenteNombre}` : `📚 ${r.EstudianteNombre}`}</p>
                  <p className="text-xs text-slate-500">📅 {format(new Date(r.FechaHoraInicio), "d MMM yyyy, HH:mm", { locale: es })} - {format(new Date(r.FechaHoraFin), 'HH:mm')}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="text-slate-400">⏱ {r.HorasTotales}h</span>
                    <span className="font-bold text-teal-600">Bs. {Number(r.PrecioTotal).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(user?.rol === 'Docente' || user?.rol === 'Auxiliar') && r.EstadoReserva === 'Pendiente' && (<>
                    <button onClick={() => act(r.ReservaID, 'confirmar', 'Confirmada')} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">✅ Confirmar</button>
                    <button onClick={() => act(r.ReservaID, 'cancelar', 'Rechazada')} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">✕ Rechazar</button>
                  </>)}
                  {(user?.rol === 'Docente' || user?.rol === 'Auxiliar') && r.EstadoReserva === 'Confirmada' && (
                    <button onClick={() => act(r.ReservaID, 'completar', 'Completada')} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">✓ Completar</button>
                  )}
                  {user?.rol === 'Estudiante' && r.EstadoReserva === 'Pendiente' && (
                    <button onClick={() => { if(confirm('¿Cancelar?')) act(r.ReservaID, 'cancelar', 'Cancelada'); }} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">✕ Cancelar</button>
                  )}
                  {user?.rol === 'Estudiante' && r.EstadoReserva === 'Completada' && !r.YaCalificado && (
                    <button onClick={() => { setSelRes(r); setShowCal(true); }} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">⭐ Calificar</button>
                  )}
                  {['Confirmada','Completada'].includes(r.EstadoReserva) && (
                    <Link to={`/chat/${r.ReservaID}`} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">💬 Chat</Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCal} onClose={() => setShowCal(false)} title="Calificar Docente">
        {selRes && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400">Clase de</p>
              <p className="text-xs font-semibold text-slate-700">{selRes.NombreMateria} con {selRes.DocenteNombre}</p>
            </div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-2">Puntuación</label><InteractiveStarRating value={punt} onChange={setPunt} /></div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Comentario</label>
              <textarea value={coment} onChange={e => setComent(e.target.value)} rows={3} placeholder="¿Cómo fue tu experiencia?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none" />
            </div>
            <button onClick={enviarCal} disabled={calEnv} className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 shadow-sm disabled:opacity-40">{calEnv ? 'Enviando...' : '⭐ Enviar Calificación'}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
