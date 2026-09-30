export default function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label ? <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span> : null}
      <input className={`input-field ${error ? 'border-red-500/60' : ''} ${className}`} {...props} />
      {error ? <span className="mt-1 block text-xs text-red-400">{error}</span> : null}
    </label>
  );
}
