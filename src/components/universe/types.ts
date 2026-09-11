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
    // Percent coordinates for spatial layout (0-100)
    x: number;
    y: number;
  };
};

export type UniverseTab =
  | "00" // OVERVIEW
  | "01" // ESSENCE
  | "02" // ECOSYSTEM
  | "03" // CHARACTER
  | "04" // VISUAL SYSTEM
  | "05" // VOICE
  | "06" // MEDIA
  | "07" // PROMPT LAB
  | "08"; // DECISIONS

// Layout-only coordinates; product identity/status/links stay in the canonical registry.
const TOPOLOGY: { productId: string; relation: NodeRelation; position: { x: number; y: number } }[] = [
  {productId:"school",relation:"teaches",position:{x:50,y:12}},
  {productId:"wire",relation:"investigates",position:{x:80,y:24}},
  {productId:"studio",relation:"creates",position:{x:88,y:62}},
  {productId:"analytics",relation:"analyzes",position:{x:70,y:88}},
  {productId:"security",relation:"protects",position:{x:30,y:88}},
  {productId:"career",relation:"guides",position:{x:12,y:62}},
  {productId:"china",relation:"connects",position:{x:20,y:24}},
  {productId:"packs",relation:"equips",position:{x:50,y:94}},
];
export const ECOSYSTEM_NODES: EcosystemNode[] = TOPOLOGY.map((node, index) => ({ ...product(node.productId), relation: node.relation, position: node.position, vector: String(index + 1).padStart(2, "0") }));
