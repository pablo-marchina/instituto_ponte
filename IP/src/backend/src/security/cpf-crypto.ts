import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

const ENVELOPE_VERSION = "v1";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const decodeKey = (value: string): Buffer => {
  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    return Buffer.from(value, "hex");
  }

  const decoded = Buffer.from(value, "base64");
  if (decoded.length === 32) return decoded;

  throw new Error("CPF_ENCRYPTION_KEY must be 32 bytes encoded as hex or base64.");
};

export const getCpfEncryptionKey = (environment = process.env): Buffer => {
  const value = environment.CPF_ENCRYPTION_KEY?.trim();
  if (value) return decodeKey(value);

  const fallbackSecret = environment.SUPABASE_JWT_SECRET?.trim() || environment.SESSION_SECRET?.trim();
  if (fallbackSecret) {
    return createHash("sha256").update(fallbackSecret).digest();
  }

  throw new Error("CPF_ENCRYPTION_KEY is required for CPF operations.");
};

export const normalizeCpf = (cpf: string): string => {
  const normalized = cpf.replace(/\D/g, "");
  if (!/^\d{11}$/.test(normalized)) {
    throw new Error("CPF must contain exactly 11 digits.");
  }
  return normalized;
};

const deriveHashKey = (key: Buffer) =>
  createHmac("sha256", key).update("cpf-search-index-v1").digest();

export const hashCpf = (cpf: string, key = getCpfEncryptionKey()): string =>
  createHmac("sha256", deriveHashKey(key)).update(normalizeCpf(cpf)).digest("hex");

export const isEncryptedCpf = (value: string): boolean => value.startsWith(`${ENVELOPE_VERSION}:`);

export const encryptCpf = (cpf: string, key = getCpfEncryptionKey()): string => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(normalizeCpf(cpf), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [ENVELOPE_VERSION, iv.toString("base64url"), encrypted.toString("base64url"), tag.toString("base64url")].join(":");
};

export const decryptCpf = (value: string, key = getCpfEncryptionKey()): string => {
  if (!isEncryptedCpf(value)) {
    return normalizeCpf(value);
  }

  const [version, ivValue, encryptedValue, tagValue, extra] = value.split(":");
  if (version !== ENVELOPE_VERSION || !ivValue || !encryptedValue || !tagValue || extra) {
    throw new Error("Invalid encrypted CPF envelope.");
  }

  const iv = Buffer.from(ivValue, "base64url");
  const encrypted = Buffer.from(encryptedValue, "base64url");
  const tag = Buffer.from(tagValue, "base64url");
  if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted CPF envelope.");
  }

  const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  return normalizeCpf(decrypted);
};
