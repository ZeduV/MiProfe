import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/ui/StarRating';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PerfilDocentePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [docente, setDocente] = useState(null);
  const [disp, setDisp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRes, setShowRes] = useState(false);
  const [selSlot, setSelSlot] = useState(null);
  const [selMat, setSelMat] = useState('');
  const [horas, setHoras] = useState(1);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { load(); loadDisp(); }, [id]);
  const load = async () => { try { setDocente((await api.get(`/docentes/${id}`)).data); } catch { navigate('/buscar'); } finally { setLoading(false); } };
  const loadDisp = async () => { try { setDisp((await api.get(`/docentes/${id}/disponibilidad`)).data.filter(d => d.Estado === 'Disponible')); } catch {} };

  const reservar = async () => {
    if (!user) { navigate('/login'); return; }
    if (!selSlot || !selMat) return toast.error('Selecciona horario y materia');
    setEnviando(true);
    try { await api.post('/reservas', { perfilID: docente.PerfilID, materiaID: parseInt(selMat), disponibilidadID: selSlot.DisponibilidadID, horasTotales: horas }); toast.success('¡Reserva creada!'); setShowRes(false); loadDisp(); }
    catch (e) { toast.error(e.response?.data?.error || 'Error'); } finally { setEnviando(false); }
  };

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;
  if (!docente) return null;
  const inp = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-6 shadow-sm anim">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0 shadow-md shadow-teal-200">
            {docente.NombreCompleto?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{docente.NombreCompleto}</h1>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${docente.Rol === 'Docente' ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-600'}`}>{docente.Rol}</span>
              </div>
              <div className="sm:text-right">
                <p className="text-2xl font-bold text-teal-600">Bs. {Number(docente.PrecioPorHora).toFixed(0)}</p>
                <p className="text-[11px] text-slate-400">por hora</p>
              </div>
            </div>
            {docente.CalificacionPromedio > 0 && <div className="mt-2 flex items-center gap-2"><StarRating rating={docente.CalificacionPromedio} /><span className="text-xs text-slate-400">({docente.TotalResenas} reseñas)</span></div>}
            {docente.Biografia && <p className="mt-3 text-sm text-slate-600 leading-relaxed">{docente.Biografia}</p>}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {docente.materias?.map(m => <span key={m.MateriaID} className="px-2.5 py-1 rounded-lg bg-teal-50 text-[11px] font-semibold text-teal-700">{m.NombreMateria}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Disponibilidad */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm anim" style={{ animationDelay: '0.05s' }}>
          <h2 className="text-base font-bold text-slate-800 mb-4">📅 Horarios Disponibles</h2>
          {disp.length === 0 ? (
            <div className="text-center py-10"><span className="text-3xl block mb-2">📭</span><p className="text-xs text-slate-400">No hay horarios disponibles</p></div>
          ) : (
            <div className="space-y-2">
              {disp.map(s => (
                <div key={s.DisponibilidadID} onClick={() => { setSelSlot(s); if (user?.rol === 'Estudiante') setShowRes(true); }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    selSlot?.DisponibilidadID === s.DisponibilidadID ? 'border-teal-500 bg-teal-50' : 'border-slate-100 hover:border-teal-200 hover:bg-slate-50'
                  }`}>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{format(new Date(s.FechaHoraInicio), "EEEE d 'de' MMMM", { locale: es })}</p>
                    <p className="text-xs text-slate-400">{format(new Date(s.FechaHoraInicio), 'HH:mm')} - {format(new Date(s.FechaHoraFin), 'HH:mm')}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">Disponible</span>
                </div>
              ))}
            </div>
          )}
          {user?.rol === 'Estudiante' && disp.length > 0 && (
            <button onClick={() => { if (!selSlot) return toast.error('Selecciona un horario'); setShowRes(true); }}
              className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 shadow-sm hover:shadow-md transition-all">📅 Agendar Clase</button>
          )}
        </div>

        {/* Reseñas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm anim" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-base font-bold text-slate-800 mb-4">⭐ Reseñas</h2>
          {(!docente.resenas || docente.resenas.length === 0) ? <p className="text-xs text-slate-400 text-center py-6">Aún no hay reseñas</p> : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {docente.resenas.map(r => (
                <div key={r.CalificacionID} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{r.EstudianteNombre}</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-[10px] font-bold text-teal-700">{r.Puntuacion}/10</span>
                  </div>
                  {r.Comentario && <p className="text-xs text-slate-500">{r.Comentario}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">{format(new Date(r.FechaCalificacion), "d MMM yyyy", { locale: es })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Reserva */}
      <Modal isOpen={showRes} onClose={() => setShowRes(false)} title="Agendar Clase">
        {selSlot && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
              <p className="text-[10px] text-teal-600 font-semibold mb-0.5">Horario</p>
              <p className="text-xs font-medium text-slate-700">{format(new Date(selSlot.FechaHoraInicio), "EEEE d 'de' MMMM, HH:mm", { locale: es })} - {format(new Date(selSlot.FechaHoraFin), 'HH:mm')}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Materia</label>
              <select value={selMat} onChange={e => setSelMat(e.target.value)} className={inp}>
                <option value="">Selecciona...</option>
                {docente.materias?.map(m => <option key={m.MateriaID} value={m.MateriaID}>{m.NombreMateria}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Horas de clase</label>
              <input type="number" min={1} max={8} value={horas} onChange={e => setHoras(Math.max(1, parseInt(e.target.value) || 1))} className={inp} />
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Precio/hora</span><span className="text-slate-700">Bs. {Number(docente.PrecioPorHora).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Horas</span><span className="text-slate-700">×{horas}</span></div>
              <hr className="border-slate-200 !my-1.5" />
              <div className="flex justify-between items-center"><span className="font-semibold text-slate-700">Total</span><span className="text-lg font-bold text-teal-600">Bs. {(Number(docente.PrecioPorHora) * horas).toFixed(2)}</span></div>
            </div>
            <button onClick={reservar} disabled={enviando || !selMat} className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 shadow-sm disabled:opacity-40 transition-all">
              {enviando ? 'Reservando...' : '✅ Confirmar Reserva'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
