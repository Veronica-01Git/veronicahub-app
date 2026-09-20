import { product, type ProductStatus } from "@/lib/ecosystem";

export type NodeRelation =
  | "teaches"
  | "investigates"
  | "creates"
  | "analyzes"
  | "protects"
  | "guides"
  | "connects"
  | "equips";

export type NodeStatus = ProductStatus;

export type EcosystemNode = {
  to: string;
  id: string;
  name: string;
  category: string;
  status: NodeStatus;
  relation: NodeRelation;
  description: string;
  vector: string;
  position: {
    x: number;
    y: number;
  };
};

export type UniverseTab =
  | "00" // TODAY
  | "01" // ESSENCE
  | "02" // ECOSYSTEM
  | "03" // CHARACTER
  | "04" // VISUAL SYSTEM
  | "05" // VOICE
  | "06" // MEDIA
  | "07" // PROMPT LAB
  | "08" // DECISIONS
  | "09" // MONEY
  | "10" // CUSTOMERS
  | "11" // FUNNELS
  | "12"; // SYSTEM HEALTH

// Topologia visual do mapa. O Veronica Core ocupa o centro; estes nós representam
// as áreas que formam o fluxo operacional do ecossistema.
const TOPOLOGY: {
  productId: string;
  relation: NodeRelation;
  position: { x: number; y: number };
}[] = [
  { productId: "formations", relation: "teaches", position: { x: 30, y: 13 } },
  { productId: "wire", relation: "investigates", position: { x: 70, y: 13 } },
  { productId: "china", relation: "connects", position: { x: 12, y: 38 } },
  { productId: "studio", relation: "creates", position: { x: 88, y: 38 } },
  { productId: "career", relation: "guides", position: { x: 12, y: 70 } },
  { productId: "analytics", relation: "analyzes", position: { x: 88, y: 70 } },
  { productId: "rh", relation: "guides", position: { x: 30, y: 90 } },
  { productId: "security", relation: "protects", position: { x: 50, y: 94 } },
  { productId: "packs", relation: "equips", position: { x: 70, y: 90 } },
  { productId: "rede", relation: "connects", position: { x: 50, y: 76 } },
];

export const ECOSYSTEM_NODES: EcosystemNode[] = TOPOLOGY.map((node, index) => ({
  ...product(node.productId),
  relation: node.relation,
  position: node.position,
  vector: String(index + 1).padStart(2, "0"),
}));
