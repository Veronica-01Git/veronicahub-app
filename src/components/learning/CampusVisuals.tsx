import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { campusImage, campusSrcSet } from "@/lib/yo-visuals";
import "@/styles/yo-campus.css";

export function CampusImage({
  name,
  alt,
  hero = false,
  className,
}: {
  name: string;
  alt: string;
  hero?: boolean;
  className?: string;
}) {
  return (
    <img
      src={campusImage(name)}
      srcSet={campusSrcSet(name)}
      sizes={hero ? "100vw" : "(max-width: 700px) 100vw, 50vw"}
      width={1280}
      height={720}
      alt={alt}
      loading={hero ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={hero ? "high" : undefined}
      className={className}
    />
  );
}

export function CampusHero({
  image,
  eyebrow,
  title,
  copy,
  action,
  discover,
  discoverLabel = "Explore",
}: {
  image: string;
  eyebrow: string;
  title: ReactNode;
  copy: string;
  action: ReactNode;
  discover: string;
  discoverLabel?: string;
}) {
  return (
    <section className="yo-campus-hero" aria-labelledby="campus-title">
      <div className="yo-campus-background" data-scene={image} aria-hidden="true">
        <CampusImage name={image} alt="" hero />
      </div>
      <div className="wf-wrap yo-campus-content">
        <p className="wf-label yo-campus-eyebrow">
          <span className="wf-led" aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 id="campus-title" className="wf-display yo-campus-title">
          {title}
        </h1>
        <p className="yo-campus-copy">{copy}</p>
        <div className="yo-campus-action">{action}</div>
        <div className="yo-campus-rail">
          <span>YO LAB &amp; CO. · Veronica School</span>
          <a href={discover} className="wf-focus">
            {discoverLabel}
            <ArrowDown size={15} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

const rooms = [
  {
    to: "/escola",
    image: "school",
    number: "01",
    title: "Escola",
    copy: "O campus da sua próxima ideia.",
  },
  {
    to: "/aula-zero",
    image: "aula",
    number: "02",
    title: "Aula Zero",
    copy: "Seu primeiro projeto com IA.",
  },
  {
    to: "/formacoes",
    image: "formacoes",
    number: "03",
    title: "Formações",
    copy: "Escolha o que quer construir.",
  },
  {
    to: "/prompt-packs",
    image: "packs",
    number: "04",
    title: "Prompt Packs",
    copy: "Dê direção à sua criação.",
  },
] as const;

export function CampusNavigation({ current }: { current?: (typeof rooms)[number]["to"] }) {
  return (
    <nav className="yo-campus-navigation" aria-label="Ambientes da Escola Veronica">
      <div className="wf-wrap">
        <div className="yo-campus-nav-heading">
          <p className="wf-index">Explore o campus</p>
          <p className="yo-campus-nav-note">Uma inteligência. Novos caminhos.</p>
        </div>
        <div className="yo-campus-rooms">
          {rooms.map((room) => (
            <Link
              key={room.to}
              to={room.to}
              className="yo-campus-room wf-focus"
              aria-current={current === room.to ? "page" : undefined}
            >
              <div className="yo-campus-room-image">
                <CampusImage name={room.image} alt="" />
                <span>{room.number} / YO</span>
                <ArrowUpRight size={20} aria-hidden="true" />
              </div>
              <div className="yo-campus-room-copy">
                <h2>{room.title}</h2>
                <p>{room.copy}</p>
                {current === room.to && <span className="yo-campus-current">Você está aqui</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
