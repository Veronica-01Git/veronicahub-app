// Shim mínimo — o projeto não depende de @cloudflare/workers-types. Só o
// que src/lib/generations-storage.ts realmente usa (put no binding do R2).
declare module "cloudflare:workers" {
  interface R2PutOptions {
    httpMetadata?: { contentType?: string };
  }
  interface R2Bucket {
    put(
      key: string,
      value: ArrayBuffer | ArrayBufferView | ReadableStream | string,
      options?: R2PutOptions,
    ): Promise<unknown>;
  }
  export const env: {
    GENERATIONS_BUCKET: R2Bucket;
    [key: string]: unknown;
  };
}
