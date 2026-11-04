import { describe, expect, it } from "vitest";
import { normalizeUsername, validateEmail, validatePassword, validateUsername } from "./validation";

describe("validateEmail", () => {
  it("accepts normal addresses and rejects malformed ones", () => {
    expect(validateEmail("a@b.co")).toBeNull();
    expect(validateEmail("  me@example.com ")).toBeNull();
    expect(validateEmail("")).not.toBeNull();
    expect(validateEmail("nope")).not.toBeNull();
    expect(validateEmail("a@b")).not.toBeNull();
  });
});

describe("validateUsername", () => {
  it("normalizes case and whitespace", () => {
    expect(normalizeUsername("  Sami_1 ")).toBe("sami_1");
    expect(validateUsername("  Sami_1 ")).toBeNull();
  });
  it("enforces length and characters", () => {
    expect(validateUsername("ab")).not.toBeNull();
    expect(validateUsername("a".repeat(21))).not.toBeNull();
    expect(validateUsername("has space")).not.toBeNull();
    expect(validateUsername("emoji😀")).not.toBeNull();
    expect(validateUsername("")).not.toBeNull();
  });
});

describe("validatePassword", () => {
  it("requires at least 8 characters", () => {
    expect(validatePassword("1234567")).not.toBeNull();
    expect(validatePassword("12345678")).toBeNull();
    expect(validatePassword("")).not.toBeNull();
  });
});
