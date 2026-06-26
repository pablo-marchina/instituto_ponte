import { describe, expect, it } from "@jest/globals";
import { stableJson } from "../../helpers/stable-json.js";
import { requestHash } from "../../middlewares/idempotency.js";

describe("idempotency helpers", () => {
  it("canoniza objetos independentemente da ordem das chaves", () => {
    expect(stableJson({ b: 2, a: [1, { d: 4, c: 3 }] })).toBe('{"a":[1,{"c":3,"d":4}],"b":2}');
    expect(requestHash({ a: 1, b: 2 })).toBe(requestHash({ b: 2, a: 1 }));
  });

  it("distingue payloads diferentes", () => {
    expect(requestHash({ value: 1 })).not.toBe(requestHash({ value: 2 }));
    expect(stableJson(null)).toBe("null");
  });
});
