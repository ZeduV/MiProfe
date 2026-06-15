import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [materiasList, setMateriasList] = useState([]);
  const [form, setForm] = useState({ nombreCompleto: '', email: '', password: '', confirmPassword: '', rol: '', biografia: '', precioPorHora: '', materias: [], disponibilidad: [] });
  const [newSlot, setNewSlot] = useState({ inicio: '', fin: '' });
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { api.get('/materias').then(r => setMateriasList(r.data)).catch(() => {}); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleMat = (id) => set('materias', form.materias.includes(id) ? form.materias.filter(m => m !== id) : [...form.materias, id]);
  const isDoc = form.rol === 'Docente' || form.rol === 'Auxiliar';
  const totalSteps = isDoc ? 3 : 1;

  const addSlot = () => {
    if (!newSlot.inicio || !newSlot.fin) return toast.error('Completa ambos campos');
    if (new Date(newSlot.fin) <= new Date(newSlot.inicio)) return toast.error('Fin debe ser posterior al inicio');
    set('disponibilidad', [...form.disponibilidad, { ...newSlot }]);
    setNewSlot({ inicio: '', fin: '' });
  };

  const canNext = () => {
    if (step === 1) return form.nombreCompleto && form.email && form.password && form.confirmPassword && form.rol;
    if (step === 2) return form.materias.length > 0 && form.precioPorHora;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Las contraseñas no coinciden');
    if (form.password.length < 6) return toast.error('La contraseña debe tener mínimo 6 caracteres');
    setLoading(true);
    try {
      const data = { nombreCompleto: form.nombreCompleto, email: form.email, password: form.password, rol: form.rol };
      if (isDoc) { data.biografia = form.biografia; data.precioPorHora = parseFloat(form.precioPorHora) || 0; data.materias = form.materias; data.disponibilidad = form.disponibilidad; }
      await register(data);
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/');
    } catch (err) { toast.error(err.response?.data?.error || 'Error al registrarse'); } finally { setLoading(false); }
  };

  const inp = "w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all";
  const lbl = "block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden pt-24 pb-12">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900 to-slate-50 opacity-5"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-400 blur-[100px] opacity-10"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-400 blur-[100px] opacity-10"></div>

      <div className="w-full max-w-lg relative z-10 anim">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white font-bold text-2xl mb-5 shadow-xl shadow-indigo-200 hover:scale-105 transition-transform">
            M
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Únete a la comunidad</h1>
          <p className="text-sm text-slate-500 font-medium mt-2">Crea tu cuenta gratis y comienza hoy mismo</p>
        </div>

        {isDoc && (
          <div className="flex gap-2 mb-6 px-2">
            {[1,2,3].map(s => (
              <div key={s} className="flex-1 relative">
                <div className={`h-2 rounded-full transition-all duration-500 ${s <= step ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-md shadow-indigo-200' : 'bg-slate-200'}`}></div>
                <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider ${s <= step ? 'text-indigo-600' : 'text-slate-400'}`}>Paso {s}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className={`bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-6 sm:p-8 space-y-6 shadow-2xl shadow-indigo-900/5 ${isDoc ? 'mt-10' : ''}`}>
          {step === 1 && (<>
            <div>
              <label className={lbl}>¿Cuál es tu rol?</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[{r:'Estudiante',i:'📚',d:'Quiero aprender'},{r:'Docente',i:'👨‍🏫',d:'Quiero enseñar'},{r:'Auxiliar',i:'🎓',d:'Apoyo extra'}].map(({r,i,d}) => (
                  <button key={r} type="button" onClick={() => set('rol', r)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-2 ${
                      form.rol === r ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'
                    }`}>
                    <span className="text-3xl block">{i}</span>
                    <div>
                      <span className={`block text-sm font-bold ${form.rol === r ? 'text-indigo-700' : 'text-slate-700'}`}>{r}</span>
                      <span className={`block text-[10px] font-medium mt-0.5 ${form.rol === r ? 'text-indigo-500' : 'text-slate-400'}`}>{d}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className={lbl}>Nombre completo</label>
                <input type="text" value={form.nombreCompleto} onChange={e => set('nombreCompleto', e.target.value)} required placeholder="Ej. Juan Pérez" className={inp} />
              </div>
              <div>
                <label className={lbl}>Correo electrónico</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="tu@email.com" className={inp} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Contraseña</label>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="••••••••" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Confirmar</label>
                  <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required placeholder="••••••••" className={inp} />
                </div>
              </div>
            </div>
          </>)}

          {step === 2 && isDoc && (<>
            <div className="anim">
              <h3 className="text-lg font-bold text-slate-800 mb-5">Configura tu perfil docente</h3>
              <div className="space-y-5">
                <div>
                  <label className={lbl}>Precio por hora (Bs.)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Bs.</span>
                    <input type="number" min="1" step="1" value={form.precioPorHora} onChange={e => set('precioPorHora', e.target.value)} required placeholder="50" className={`${inp} pl-12 text-lg`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Especialidades ({form.materias.length} seleccionadas)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-2 rounded-2xl bg-slate-50 p-2 border border-slate-200">
                    {materiasList.map(m => (
                      <button key={m.MateriaID} type="button" onClick={() => toggleMat(m.MateriaID)}
                        className={`py-3 px-3 rounded-xl text-xs sm:text-sm text-left transition-all border-2 ${
                          form.materias.includes(m.MateriaID) ? 'border-indigo-500 bg-white text-indigo-700 font-bold shadow-sm' : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800 font-semibold'
                        }`}>
                        {form.materias.includes(m.MateriaID) ? '✓ ' : ''}{m.NombreMateria}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lbl}>Biografía (opcional)</label>
                  <textarea value={form.biografia} onChange={e => set('biografia', e.target.value)} rows={3} placeholder="Cuéntale a los estudiantes sobre tu experiencia y metodología de enseñanza..." className={`${inp} resize-none leading-relaxed`} />
                </div>
              </div>
            </div>
          </>)}

          {step === 3 && isDoc && (<>
            <div className="anim">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Disponibilidad Inicial</h3>
              <p className="text-sm text-slate-500 font-medium mb-5">Agrega tus primeros horarios libres. Podrás modificarlos después.</p>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Inicio</label>
                      <input type="datetime-local" value={newSlot.inicio} onChange={e => setNewSlot(p=>({...p,inicio:e.target.value}))} className={`${inp} py-2.5 px-3 text-xs`} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fin</label>
                      <input type="datetime-local" value={newSlot.fin} onChange={e => setNewSlot(p=>({...p,fin:e.target.value}))} className={`${inp} py-2.5 px-3 text-xs`} />
                    </div>
                  </div>
                  <button type="button" onClick={addSlot} className="w-full py-2.5 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-600 text-sm font-bold bg-white hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                    + Agregar a la lista
                  </button>
                </div>

                {form.disponibilidad.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <label className={lbl}>Horarios agregados</label>
                    {form.disponibilidad.map((s,i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-500">📅</span>
                          <span>{new Date(s.inicio).toLocaleString('es-BO',{dateStyle:'short',timeStyle:'short'})}</span>
                          <span className="text-slate-400">→</span>
                          <span>{new Date(s.fin).toLocaleString('es-BO',{timeStyle:'short'})}</span>
                        </div>
                        <button type="button" onClick={() => set('disponibilidad', form.disponibilidad.filter((_,j)=>j!==i))} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>)}

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step-1)} className="px-6 py-4 rounded-2xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
                Volver
              </button>
            )}
            {step < totalSteps ? (
              <button type="button" onClick={() => setStep(step+1)} disabled={!canNext()} className="flex-1 py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-indigo-200">
                Continuar al siguiente paso
              </button>
            ) : (
              <button type="submit" disabled={loading || !canNext()} className="flex-1 py-4 rounded-2xl text-sm font-bold text-white bg-slate-900 shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : null}
                  {loading ? 'Procesando...' : 'Completar Registro'}
                </span>
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm font-medium text-slate-500 mt-8">
          ¿Ya eres parte de MiProfe? <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline underline-offset-4">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
