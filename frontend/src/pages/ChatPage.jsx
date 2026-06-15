import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ChatPage() {
  const { reservaId } = useParams();
  const { user } = useAuth();
  const { joinReserva, leaveReserva, sendMessage: socketSend, onMessage, onTyping, sendTyping } = useSocket();
  const [convs, setConvs] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(null);
  const endRef = useRef(null);
  const tRef = useRef(null);

  useEffect(() => { api.get('/chat/conversaciones').then(r => setConvs(r.data)).catch(() => {}).finally(() => { if (!reservaId) setLoading(false); }); }, []);

  useEffect(() => {
    if (!reservaId) return;
    setLoading(true);
    api.get(`/chat/${reservaId}`).then(r => { setMsgs(r.data); scroll(); }).catch(() => {}).finally(() => setLoading(false));
    joinReserva(reservaId);
    return () => leaveReserva(reservaId);
  }, [reservaId]);

  useEffect(() => { return onMessage(m => { if (String(m.ReservaID) === String(reservaId)) { setMsgs(p => [...p, m]); scroll(); } }); }, [reservaId, onMessage]);
  useEffect(() => { return onTyping(d => { setTyping(d.nombreCompleto); if (tRef.current) clearTimeout(tRef.current); tRef.current = setTimeout(() => setTyping(null), 2000); }); }, [onTyping]);

  const scroll = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);

  const send = async (e) => {
    e.preventDefault();
    if (!txt.trim() || sending) return;
    setSending(true);
    try { const r = await api.post(`/chat/${reservaId}`, { contenido: txt.trim() }); setMsgs(p => [...p, r.data]); socketSend(r.data); setTxt(''); scroll(); }
    catch (e) { toast.error('Error'); } finally { setSending(false); }
  };

  // Lista de conversaciones
  if (!reservaId) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-5 anim"><h1 className="text-xl font-bold text-slate-800">💬 Mensajes</h1><p className="text-xs text-slate-400 mt-1">Coordina tus clases</p></div>
        {loading ? <LoadingSpinner className="py-20" /> : convs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
            <span className="text-4xl block mb-3">💬</span>
            <h3 className="text-base font-bold text-slate-700 mb-1">Sin conversaciones</h3>
            <p className="text-xs text-slate-400">Se habilita al confirmar una reserva</p>
          </div>
        ) : (
          <div className="space-y-2">
            {convs.map((c, i) => (
              <Link key={c.ReservaID} to={`/chat/${c.ReservaID}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3.5 shadow-sm hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5 transition-all anim"
                style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                  {c.OtroNombre?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 truncate">{c.OtroNombre}</h3>
                    {c.UltimaFecha && <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{format(new Date(c.UltimaFecha), 'd MMM', { locale: es })}</span>}
                  </div>
                  <p className="text-[11px] text-teal-600 font-semibold">{c.NombreMateria}</p>
                  {c.UltimoMensaje && <p className="text-xs text-slate-400 truncate">{c.UltimoMensaje}</p>}
                </div>
                <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const conv = convs.find(c => String(c.ReservaID) === String(reservaId));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 mb-3 flex items-center gap-3 shadow-sm fade">
        <Link to="/chat" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">←</Link>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{conv?.OtroNombre?.charAt(0)?.toUpperCase() || '?'}</div>
        <div><p className="text-sm font-semibold text-slate-700">{conv?.OtroNombre || 'Chat'}</p><p className="text-[10px] text-teal-600 font-medium">{conv?.NombreMateria || ''}</p></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 p-4 mb-3 space-y-2 shadow-sm">
        {loading ? <LoadingSpinner className="py-10" /> : msgs.length === 0 ? (
          <div className="text-center py-10"><span className="text-3xl block mb-2">👋</span><p className="text-xs text-slate-400">Inicia la conversación</p></div>
        ) : msgs.map(m => {
          const me = m.RemitenteID === user?.usuarioID;
          return (
            <div key={m.MensajeID} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${me ? 'bg-teal-500 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'}`}>
                {!me && <p className="text-[10px] font-semibold text-teal-600 mb-0.5">{m.RemitenteNombre}</p>}
                <p className="text-[13px] leading-relaxed">{m.Contenido}</p>
                <p className={`text-[9px] mt-0.5 ${me ? 'text-white/60' : 'text-slate-400'}`}>{format(new Date(m.FechaEnvio), 'HH:mm')}</p>
              </div>
            </div>
          );
        })}
        {typing && <div className="flex items-center gap-1.5 text-xs text-slate-400"><div className="flex gap-0.5"><span className="tdot"></span><span className="tdot"></span><span className="tdot"></span></div>{typing} escribiendo...</div>}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="bg-white rounded-2xl border border-slate-200 p-2.5 flex gap-2 shadow-sm fade">
        <input value={txt} onChange={e => { setTxt(e.target.value); if (reservaId) sendTyping(reservaId); }} placeholder="Escribe un mensaje..."
          className="flex-1 px-3.5 py-2.5 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none" />
        <button type="submit" disabled={!txt.trim() || sending}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 shadow-sm disabled:opacity-40 transition-all">
          {sending ? '...' : '📤'}
        </button>
      </form>
    </div>
  );
}
