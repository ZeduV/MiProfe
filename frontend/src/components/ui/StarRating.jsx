export default function StarRating({ rating, maxRating = 10, showValue = true }) {
  const stars = Math.round((rating / maxRating) * 5);
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5 text-sm">{[1,2,3,4,5].map(s => <span key={s} className={s <= stars ? 'text-amber-400' : 'text-slate-200'}>★</span>)}</div>
      {showValue && <span className="text-xs font-semibold text-slate-500 ml-0.5">{Number(rating).toFixed(1)}/10</span>}
    </div>
  );
}
export function InteractiveStarRating({ value, onChange, maxValue = 10 }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input type="range" min="1" max={maxValue} value={value} onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-teal-500" />
        <span className="text-2xl font-bold text-teal-600 min-w-[2.5rem] text-center">{value}</span>
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 px-0.5"><span>Malo</span><span>Regular</span><span>Bueno</span><span>Excelente</span></div>
    </div>
  );
}
