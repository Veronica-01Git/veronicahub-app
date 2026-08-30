import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const B64 = [
  "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",
];

const buf = Buffer.from(B64.join(""), "base64");
const sha = createHash("sha256").update(buf).digest("hex").slice(0, 16);
console.log("bytes:", buf.length, "sha256:", sha);
if (buf.length !== 3943 || sha !== "76162306268e0c65") {
  throw new Error("base64 truncada ou alterada — NAO grave o arquivo. Esperado 3943 bytes / sha 76162306268e0c65");
}
writeFileSync("public/icon-192.png", buf);
console.log("ok: public/icon-192.png regravado");
