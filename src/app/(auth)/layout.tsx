export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Lado esquerdo — visual industrial */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#111111] text-white relative overflow-hidden">
        {/* Textura industrial de fundo */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#C87941] flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <span className="font-bold text-xl tracking-wider">FORJA PRO</span>
              <p className="text-xs text-white/50 tracking-widest uppercase">Equipamentos Profissionais</p>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <blockquote className="space-y-4">
            <p className="text-2xl font-light leading-relaxed text-white/90">
              Excelência em equipamentos para cozinhas profissionais.
            </p>
            <div className="w-12 h-0.5 bg-[#C87941]" />
            <p className="text-sm text-white/40 tracking-widest uppercase">
              Sistema de Gestão Comercial
            </p>
          </blockquote>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded bg-[#C87941] flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <span className="font-bold text-lg tracking-wider">FORJA PRO</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
