// Hero da home — vídeo em loop da cyborg (rosto humano/robótico), screen
// blend + vinheta via máscara CSS radial pra fundir com o fundo. Fallback
// estático (poster) no mobile e em prefers-reduced-motion, sem autoplay/decode.
// object-contain (não cover) em ambos: o frame-fonte já enquadra o rosto
// inteiro (testa ao queixo, olho humano ao robótico) sem sobra — cover
// cortava esse enquadramento já apertado pra preencher o retângulo do hero.
export function VeronicaHero() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block motion-reduce:md:hidden"
        style={{
          mixBlendMode: "screen",
          opacity: 0.85,
          maskImage: "radial-gradient(ellipse 78% 82% at 50% 50%, black 45%, transparent 88%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 78% 82% at 50% 50%, black 45%, transparent 88%)",
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/images/home/veronica-cyborg-hero-poster.webp"
          className="absolute inset-0 h-full w-full object-contain"
        >
          <source src="/videos/veronica-cyborg-hero.mp4" type="video/mp4" />
        </video>
      </div>
      {/* Fallback estático: mobile sempre, e desktop com prefers-reduced-motion —
          mesmo poster do vídeo, sem autoplay, sem custo de decode. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 block bg-contain bg-center bg-no-repeat opacity-[0.42] md:hidden motion-reduce:md:block"
        style={{
          backgroundImage: "url(/images/home/veronica-cyborg-hero-poster.webp)",
          filter: "contrast(1.08) saturate(0.85) brightness(0.95)",
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}
