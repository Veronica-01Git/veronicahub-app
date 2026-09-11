export function SealAtmosphere({ compact = false }: { compact?: boolean }) {
  const nodes = [[8,68],[18,28],[28,56],[40,20],[47,72],[60,42],[70,16],[78,64],[91,34],[96,78]];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(oklch(0.56_0.13_195/.065)_1px,transparent_1px),linear-gradient(90deg,oklch(0.56_0.13_195/.065)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_95%)]" />
      <div className="absolute -right-24 top-4 h-[32rem] w-[32rem] rounded-full border border-neon-cyan/20 bg-white/20 [box-shadow:inset_0_0_80px_oklch(0.58_0.17_155/.05),0_0_90px_oklch(0.56_0.13_195/.08)] motion-safe:animate-[spin_28s_linear_infinite]" />
      <div className="absolute right-8 top-32 h-72 w-72 rounded-[44%_56%_62%_38%/46%_42%_58%_54%] border border-neon-green/25 bg-neon-green/[.025] motion-safe:animate-[spin_19s_linear_infinite_reverse]" />
      <div className="absolute left-[8%] top-[10%] h-64 w-64 rounded-full bg-neon-cyan/[.07] blur-3xl" />
      {!compact && <svg className="absolute inset-x-0 bottom-0 h-[72%] w-full opacity-50" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs><linearGradient id="seal-neural-line" x1="0" x2="1"><stop stopColor="oklch(0.56 0.13 195)" stopOpacity=".05" /><stop offset=".55" stopColor="oklch(0.58 0.17 155)" stopOpacity=".5" /><stop offset="1" stopColor="oklch(0.56 0.13 195)" stopOpacity=".08" /></linearGradient></defs>
        <g fill="none" stroke="url(#seal-neural-line)" strokeWidth=".17"><path d="M8 68 18 28 28 56 40 20 47 72 60 42 70 16 78 64 91 34 96 78" /><path d="M8 68 28 56 47 72 78 64 96 78M18 28 40 20 60 42 70 16 91 34" /><path d="M18 28 28 56 60 42 78 64M40 20 47 72 70 16" opacity=".55" /></g>
        {nodes.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3===0?.75:.45} fill={i%2?"oklch(0.56 0.13 195)":"oklch(0.58 0.17 155)"} className="motion-safe:animate-pulse" style={{animationDelay:`${i*170}ms`}} />)}
      </svg>}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/70 to-transparent motion-safe:animate-pulse" />
    </div>
  );
}
