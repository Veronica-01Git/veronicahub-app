export function VeronicaPresence() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-full sm:w-[72%] lg:w-[54%]">
        <div className="absolute left-1/2 top-[28rem] h-[34rem] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan/10 blur-[70px] lg:left-[58%] lg:top-[26rem] lg:h-[28rem] lg:w-[54%] lg:bg-neon-cyan/[0.035] lg:blur-[95px]" />
        <div className="absolute left-[62%] top-[27rem] hidden h-[21rem] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/[0.025] blur-[105px] lg:block" />
        <div className="absolute left-1/2 top-[59rem] h-px w-[58%] -translate-x-1/2 bg-gradient-to-r from-transparent via-neon-cyan/80 to-transparent shadow-[0_0_22px_rgba(34,211,238,0.8)]" />

        <div className="absolute right-[-20%] top-14 w-[76%] opacity-35 sm:right-[-5%] sm:top-10 sm:w-[72%] sm:opacity-65 lg:right-[7%] lg:top-10 lg:w-[58%] lg:opacity-100">
          <div className="absolute -inset-[5%] hidden rounded-[48%] bg-[radial-gradient(ellipse_at_50%_38%,rgba(34,211,238,0.06),rgba(34,211,238,0.02)_40%,transparent_72%)] blur-3xl lg:block" />

          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/images/veronica/veronica-hero-natural-poster.webp"
            className="relative block h-auto w-full object-cover drop-shadow-[0_0_24px_rgba(34,211,238,0.16)] lg:opacity-[0.62] lg:saturate-[0.68] lg:contrast-[1.08] lg:brightness-[0.72] lg:[mask-image:radial-gradient(ellipse_68%_74%_at_50%_40%,black_44%,rgba(0,0,0,0.9)_68%,transparent_100%)] lg:drop-shadow-[0_0_24px_rgba(34,211,238,0.08)]"
          >
            <source src="/videos/veronica-hero-natural.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-[2%] hidden bg-[radial-gradient(ellipse_at_50%_40%,rgba(210,252,255,0.025),rgba(34,211,238,0.012)_46%,transparent_76%)] opacity-40 mix-blend-screen lg:block" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(34,211,238,0.08)_48%,transparent_51%)] bg-[length:100%_9px] opacity-35 mix-blend-screen lg:bg-[linear-gradient(180deg,transparent_0%,rgba(34,211,238,0.045)_48%,transparent_51%)] lg:bg-[length:100%_10px] lg:opacity-20" />
          <div className="absolute inset-x-[7%] top-1/2 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/15 lg:via-background/70 lg:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/35" />
      <div className="absolute bottom-5 right-6 font-mono-tech text-[8px] uppercase tracking-[0.28em] text-neon-cyan/60 lg:bottom-8 lg:right-10">
        Veronica 7 · interface neural ativa
      </div>
    </div>
  );
}
