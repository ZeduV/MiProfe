export default function LoadingSpinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-10 h-10' };
  return <div className={`flex items-center justify-center ${className}`}><div className={`${s[size]} border-[3px] border-slate-200 border-t-teal-500 rounded-full animate-spin`}></div></div>;
}
