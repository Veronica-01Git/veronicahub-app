export function VeronicaPresence() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <img
        src="/images/veronica/veronica-hero-poster.webp"
        alt=""
        width={768}
        height={1365}
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-[50%_27%] opacity-30 sm:object-[62%_27%] lg:left-auto lg:right-0 lg:w-[52%] lg:object-cover lg:object-[50%_30%] lg:opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/20 lg:via-background/75 lg:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/45" />
      <div className="absolute right-[10%] top-[31%] hidden h-24 w-24 rounded-full bg-neon-cyan/10 blur-3xl motion-safe:animate-pulse lg:block" />
      <div className="absolute bottom-5 right-6 font-mono-tech text-[8px] uppercase tracking-[0.28em] text-neon-cyan/60 lg:bottom-8 lg:right-10">
        Veronica 7 · presença neural
      </div>
    </div>
  );
}
