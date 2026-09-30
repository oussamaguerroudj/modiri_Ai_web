import LanguageSelector from '../../components/ui/LanguageSelector.jsx';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-ink-950 px-4 py-10 transition-colors">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelector />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <img src="/logo.png" alt="Modiri AI" className="h-10 w-10 rounded-xl object-contain drop-shadow" />
          <span className="text-xl font-bold tracking-tight text-white">
            MODIRI <span className="font-medium text-brand-blue">AI</span>
          </span>
        </div>

        <div className="panel shadow-panel p-8">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>

        {footer ? <div className="mt-6 text-center text-sm text-slate-400">{footer}</div> : null}
      </div>
    </div>
  );
}
