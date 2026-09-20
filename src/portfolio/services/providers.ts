export type ProviderCapability = "text" | "image" | "video" | "voice";

export interface AIProvider<Input = unknown, Output = unknown> {
  readonly id: string;
  readonly capabilities: ProviderCapability[];
  generate(input: Input): Promise<Output>;
}

export interface ImageProvider<Input = unknown, Output = unknown> {
  readonly id: string;
  generateImage(input: Input): Promise<Output>;
}

export interface VideoProvider<Input = unknown, Output = unknown> {
  readonly id: string;
  generateVideo(input: Input): Promise<Output>;
}

export interface VoiceProvider<Input = unknown, Output = unknown> {
  readonly id: string;
  generateVoice(input: Input): Promise<Output>;
}

export interface PaymentProvider {
  readonly id: string;
  readonly available: boolean;
  createPayment(): Promise<never>;
}

// Intencionalmente sem SDK ou gateway. A futura fintech entra por adaptador.
export const unavailablePaymentProvider: PaymentProvider = {
  id: "future-fintech",
  available: false,
  async createPayment(): Promise<never> {
    throw new Error("Pagamento ainda não disponível.");
  },
};
