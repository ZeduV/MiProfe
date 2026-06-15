import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import StarRating from '../components/ui/StarRating';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function BuscarDocentesPage() {
  const [searchParams] = useSearchParams();
  const [docentes, setDocentes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matSel, setMatSel] = useState(searchParams.get('materiaId') || '');
  const [buscar, setBuscar] = useState('');

  useEffect(() => { api.get('/materias').then(r => setMaterias(r.data)).catch(() => {}); }, []);
  useEffect(() => { fetch(); }, [matSel]);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = {};
      if (matSel) params.materiaId = matSel;
      if (buscar.trim()) params.buscar = buscar.trim();
      const res = await api.get('/docentes', { params });
      setDocentes(res.data);
    } catch { setDocentes([]); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 anim">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Buscar Docentes</h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">Encuentra al profesor ideal para dominar tu próxima materia</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); fetch(); }} className="bg-white rounded-3xl border border-slate-200/80 p-4 mb-8 flex flex-col sm:flex-row gap-3 shadow-lg shadow-slate-200/40 anim" style={{ animationDelay: '0.05s' }}>
          <div className="relative flex-1 sm:max-w-xs">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002 2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <select value={matSel} onChange={e => setMatSel(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer">
              <option value="">Todas las materias</option>
              {materias.map(m => <option key={m.MateriaID} value={m.MateriaID}>{m.NombreMateria}</option>)}
            </select>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por nombre..." className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
          </div>
          <button type="submit" className="px-8 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap">
            Buscar
          </button>
        </form>

        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 ml-2">{docentes.length} resultado{docentes.length !== 1 ? 's' : ''}</p>

        {loading ? <LoadingSpinner size="lg" className="py-20" /> : docentes.length === 0 ? (
          <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
            <span className="text-5xl block mb-4">🔍</span>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No se encontraron docentes</h3>
            <p className="text-sm text-slate-500">Intenta buscar con otro nombre o selecciona una materia diferente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {docentes.map((doc, i) => (
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
                </div>
                
                {doc.CalificacionPromedio > 0 && <div className="mb-3 flex items-center gap-2"><StarRating rating={doc.CalificacionPromedio} /><span className="text-[10px] font-bold text-slate-400">({doc.TotalResenas})</span></div>}
                {doc.Biografia && <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed font-medium">{doc.Biografia}</p>}
                
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {doc.materias?.slice(0, 3).map(m => <span key={m.MateriaID} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] font-bold text-slate-600">{m.NombreMateria}</span>)}
                  {doc.materias?.length > 3 && <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[11px] font-bold text-indigo-600">+{doc.materias.length - 3}</span>}
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tarifa</span>
                    <span className="text-xl font-extrabold text-indigo-600">Bs. {Number(doc.PrecioPorHora).toFixed(0)} <span className="text-xs font-bold text-slate-400 normal-case">/hora</span></span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                    <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
