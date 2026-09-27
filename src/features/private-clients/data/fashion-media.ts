export type FashionAssetKind =
  | "hero"
  | "hero-mobile"
  | "portrait"
  | "people"
  | "collection"
  | "product"
  | "architecture"
  | "material"
  | "motion";

export type FashionAssetStatus = "reference" | "generated" | "approved" | "published";

export type FashionMediaAsset = {
  id: string;
  campaign: "collection-001-human-system";
  kind: FashionAssetKind;
  src: string;
  alt: string;
  origin: "pexels" | "veronica-generated";
  status: FashionAssetStatus;
  credit?: string;
};

export const FASHION_CAMPAIGN = {
  id: "collection-001-human-system",
  label: "Collection 001",
  title: "Human System",
  statement: "Humanidade, matéria, arquitetura e inteligência.",
} as const;

export const FASHION_MEDIA: FashionMediaAsset[] = [
  {
    id: "human-system-hero-desktop",
    campaign: "collection-001-human-system",
    kind: "hero",
    src: "/media/fashion/collection-001/hero/human-system-hero-desktop.jpg",
    alt: "Dois modelos adultos em alfaiataria minimalista entre volumes monumentais de concreto",
    origin: "veronica-generated",
    status: "published",
    credit: "Veronica Fashion & Co. · Human System",
  },
  {
    id: "human-system-hero-mobile",
    campaign: "collection-001-human-system",
    kind: "hero-mobile",
    src: "/media/fashion/collection-001/hero/human-system-hero-mobile.jpg",
    alt: "Modelo adulta em alfaiataria clara diante de arquitetura mineral monumental",
    origin: "veronica-generated",
    status: "published",
    credit: "Veronica Fashion & Co. · Human System",
  },
  {
    id: "human-system-editorial",
    campaign: "collection-001-human-system",
    kind: "portrait",
    src: "/media/fashion/collection-001/portrait/human-system-editorial.jpg",
    alt: "Retrato editorial adulto em alfaiataria preta com luz cinematográfica lateral",
    origin: "veronica-generated",
    status: "published",
    credit: "Veronica Fashion & Co. · Human System",
  },
  {
    id: "human-system-full-look",
    campaign: "collection-001-human-system",
    kind: "collection",
    src: "/media/fashion/collection-001/collection/human-system-full-look.jpg",
    alt: "Look completo de alfaiataria em cenário brutalista com movimento natural de tecido",
    origin: "veronica-generated",
    status: "published",
    credit: "Veronica Fashion & Co. · Human System",
  },
];

export const fashionMediaByKind = (kind: FashionAssetKind) =>
  FASHION_MEDIA.filter((asset) => asset.kind === kind);

export const fashionMediaById = (id: string) =>
  FASHION_MEDIA.find((asset) => asset.id === id);
