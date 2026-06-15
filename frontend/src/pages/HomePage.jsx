import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/ui/StarRating';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matSel, setMatSel] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/materias').then(r => setMaterias(r.data)),
      api.get('/docentes').then(r => setDocentes(r.data))
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-slate-900 overflow-hidden mb-12 shadow-2xl shadow-indigo-900/20 anim">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-violet-900/40 to-slate-900"></div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-violet-500/20 blur-3xl"></div>
          
          <div className="relative px-6 py-12 sm:px-12 sm:py-20 flex flex-col items-center text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-200 text-xs font-bold tracking-wider uppercase mb-6 shadow-xl">
              Plataforma Educativa N°1 en Santa Cruz
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight max-w-4xl">
              Domina cualquier materia con el <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">profesor ideal</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mb-10 max-w-2xl font-medium">
              Conecta con estudiantes universitarios, auxiliares y docentes profesionales. Agenda clases presenciales o virtuales y mejora tu rendimiento académico hoy mismo.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={e => { e.preventDefault(); navigate(matSel ? `/buscar?materiaId=${matSel}` : '/buscar'); }}
              className="w-full max-w-2xl flex flex-col sm:flex-row gap-3 p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-full shadow-2xl">
              <div className="flex-1 relative flex items-center">
                <svg className="absolute left-4 w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                <select value={matSel} onChange={e => setMatSel(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 sm:py-3 bg-transparent text-white text-sm sm:text-base font-medium focus:outline-none appearance-none cursor-pointer [&>option]:text-slate-900">
                  <option value="">¿Qué quieres aprender hoy?</option>
                  {materias.map(m => <option key={m.MateriaID} value={m.MateriaID}>{m.NombreMateria}</option>)}
                </select>
                <svg className="absolute right-4 w-4 h-4 text-white/50 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              <button type="submit" className="w-full sm:w-auto px-8 py-3.5 rounded-xl sm:rounded-full text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all">
                Buscar ahora
              </button>
            </form>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-16">
          {[
            { l: 'Docentes Activos', v: `+${docentes.length || 0}`, icon: '👨‍🏫', color: 'indigo' },
            { l: 'Materias Disponibles', v: materias.length || 0, icon: '📚', color: 'violet' },
            { l: 'Estudiantes Felices', v: '+500', icon: '⭐', color: 'emerald' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow anim" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`w-14 h-14 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center text-2xl shadow-inner`}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{s.v}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-0.5">{s.l}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Top Teachers */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Docentes Destacados</h2>
              <p className="text-slate-500 font-medium">Aprende con los perfiles mejor valorados de nuestra plataforma</p>
            </div>
            <Link to="/buscar" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
              Ver todos <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>

          {loading ? <LoadingSpinner className="py-20" /> : docentes.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
              <span className="text-5xl block mb-4">🌱</span>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Nuestra comunidad está creciendo</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">Pronto verás a los mejores docentes de Santa Cruz aquí. ¿Eres docente? ¡Sé el primero en registrarte!</p>
              <Link to="/register" className="inline-block px-8 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg">Crear perfil docente</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {docentes.slice(0, 6).map((doc, i) => (
                <Link key={doc.PerfilID} to={`/docente/${doc.PerfilID}`}
                  className="group bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 anim"
                  style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200/50 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-inner group-hover:scale-105 transition-transform">
                        {doc.NombreCompleto?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{doc.NombreCompleto}</h3>
                        <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${doc.Rol === 'Docente' ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-50 text-violet-600'}`}>
                          {doc.Rol}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-slate-900">{Number(doc.PrecioPorHora).toFixed(0)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bs/hr</p>
                    </div>
                  </div>
                  
                  {doc.CalificacionPromedio > 0 && <div className="mb-3"><StarRating rating={doc.CalificacionPromedio} /></div>}
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed font-medium">{doc.Biografia || 'Sin descripción detallada.'}</p>
                  
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-100">
                    {doc.materias?.slice(0, 3).map(m => <span key={m.MateriaID} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] font-bold text-slate-600">{m.NombreMateria}</span>)}
                    {doc.materias?.length > 3 && <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500">+{doc.materias.length - 3}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CTA Section */}
        {!user && (
          <section className="relative rounded-3xl overflow-hidden bg-indigo-600 anim">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwb2x5Z29uIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIgcG9pbnRzPSIwIDYwIDMwIDAgNjAgNjAiLz48L2c+PC9zdmc+')] opacity-20"></div>
            <div className="relative px-6 py-12 sm:p-16 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="text-center sm:text-left max-w-xl">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">¿Eres un experto en tu área?</h3>
                <p className="text-indigo-100 text-lg font-medium">Únete a cientos de docentes que ya están compartiendo su conocimiento y generando ingresos extra.</p>
              </div>
              <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link to="/register" className="w-full sm:w-auto text-center px-8 py-3.5 rounded-xl text-sm font-bold text-indigo-600 bg-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all">Crear cuenta docente</Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
