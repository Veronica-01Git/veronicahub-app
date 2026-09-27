export type FashionAssetKind = "hero" | "portrait" | "people" | "product" | "architecture" | "material" | "motion";
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
    id: "reference-hero-01",
    campaign: "collection-001-human-system",
    kind: "hero",
    src: "https://images.pexels.com/photos/30372261/pexels-photo-30372261.jpeg?auto=compress&cs=tinysrgb&w=1800",
    alt: "Retrato editorial humano em direção de moda contemporânea",
    origin: "pexels",
    status: "reference",
    credit: "Pexels",
  },
  {
    id: "reference-people-01",
    campaign: "collection-001-human-system",
    kind: "people",
    src: "https://images.pexels.com/photos/32548829/pexels-photo-32548829.jpeg?auto=compress&cs=tinysrgb&w=1800",
    alt: "Composição humana couture em atmosfera cinematográfica",
    origin: "pexels",
    status: "reference",
    credit: "Pexels",
  },
  {
    id: "reference-architecture-01",
    campaign: "collection-001-human-system",
    kind: "architecture",
    src: "https://images.pexels.com/photos/14559203/pexels-photo-14559203.jpeg?auto=compress&cs=tinysrgb&w=1800",
    alt: "Figura humana e arquitetura moderna em composição editorial",
    origin: "pexels",
    status: "reference",
    credit: "Pexels",
  },
];

export const fashionMediaByKind = (kind: FashionAssetKind) =>
  FASHION_MEDIA.filter((asset) => asset.kind === kind);
