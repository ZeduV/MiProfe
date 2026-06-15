import { useEffect } from 'react';
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const w = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose}></div>
      <div className={`relative ${w[size]} w-full bg-white rounded-2xl p-6 shadow-xl anim border border-slate-200`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-sm transition-colors">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
