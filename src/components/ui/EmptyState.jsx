export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {Icon ? (
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient/20 text-brand-blue">
          <Icon size={30} />
        </span>
      ) : null}
      <p className="text-lg font-semibold text-white">{title}</p>
      {description ? <p className="max-w-sm text-sm text-slate-400">{description}</p> : null}
    </div>
  );
}
