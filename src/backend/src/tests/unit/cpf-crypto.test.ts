import { describe, expect, it } from "@jest/globals";
import {
  decryptCpf,
  encryptCpf,
  getCpfEncryptionKey,
  hashCpf,
  isEncryptedCpf,
  normalizeCpf,
} from "../../security/cpf-crypto.js";

const key = Buffer.alloc(32, 7);

describe("CPF crypto", () => {
  it("normaliza, criptografa e descriptografa CPF", () => {
    expect(normalizeCpf("123.456.789-01")).toBe("12345678901");
    const encrypted = encryptCpf("12345678901", key);
    expect(isEncryptedCpf(encrypted)).toBe(true);
    expect(encrypted).not.toContain("12345678901");
    expect(decryptCpf(encrypted, key)).toBe("12345678901");
  });

  it("gera hash deterministico e ciphertext aleatorio", () => {
    expect(hashCpf("12345678901", key)).toBe(hashCpf("123.456.789-01", key));
    expect(encryptCpf("12345678901", key)).not.toBe(encryptCpf("12345678901", key));
  });

  it("aceita legado em texto puro e rejeita valores invalidos", () => {
    expect(decryptCpf("12345678901", key)).toBe("12345678901");
    expect(() => normalizeCpf("123")).toThrow("11 digits");
    expect(() => decryptCpf("v1:invalid:invalid:invalid", key)).toThrow();
    expect(() => decryptCpf("v1:iv:payload", key)).toThrow("Invalid encrypted CPF envelope.");
    expect(() => decryptCpf("v1:iv:payload:tag:extra", key)).toThrow("Invalid encrypted CPF envelope.");
    const encrypted = encryptCpf("12345678901", key);
    expect(() => decryptCpf(encrypted, Buffer.alloc(32, 8))).toThrow();
  });

  it("valida chave obrigatoria em hex ou base64", () => {
    expect(getCpfEncryptionKey({ CPF_ENCRYPTION_KEY: key.toString("hex") } as NodeJS.ProcessEnv)).toEqual(key);
    expect(getCpfEncryptionKey({ CPF_ENCRYPTION_KEY: key.toString("base64") } as NodeJS.ProcessEnv)).toEqual(key);
    expect(() => getCpfEncryptionKey({} as NodeJS.ProcessEnv)).toThrow("required");
    expect(() => getCpfEncryptionKey({ CPF_ENCRYPTION_KEY: "invalid" } as NodeJS.ProcessEnv)).toThrow("32 bytes");
  });
});
