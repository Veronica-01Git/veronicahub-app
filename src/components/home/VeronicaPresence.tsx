export function VeronicaPresence() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-full sm:w-[72%] lg:w-[54%]">
        <div className="absolute left-1/2 top-[28rem] h-[34rem] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan/10 blur-[70px] lg:hidden" />
        <div className="absolute left-1/2 top-[59rem] h-px w-[58%] -translate-x-1/2 bg-gradient-to-r from-transparent via-neon-cyan/80 to-transparent shadow-[0_0_22px_rgba(34,211,238,0.8)]" />

        <div className="absolute right-[-20%] top-14 w-[76%] bg-black opacity-35 sm:right-[-5%] sm:top-10 sm:w-[72%] sm:opacity-65 lg:right-[7%] lg:top-10 lg:w-[58%] lg:bg-transparent lg:opacity-100">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/images/veronica/veronica-hero-natural-poster.webp"
            disablePictureInPicture
            className="relative block h-auto w-full object-cover lg:mix-blend-screen"
          >
            <source src="/videos/veronica-hero-natural.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/10 to-black/30 lg:hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 lg:hidden" />
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
