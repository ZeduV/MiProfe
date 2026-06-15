import { Link } from 'react-router-dom';
export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">M</div>
          <span className="text-sm font-bold text-slate-600">MiProfe</span>
        </Link>
        <p className="text-[11px] text-slate-400">© {new Date().getFullYear()} MiProfe · Santa Cruz de la Sierra, Bolivia</p>
      </div>
    </footer>
  );
}
