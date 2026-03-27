import { describe, expect, it } from "bun:test";
import { median, percentile, roundTo, minutesToHours } from "../stats";

describe("median", () => {
  it("returns 0 for empty array", () => {
    expect(median([])).toBe(0);
  });

  it("returns single element", () => {
    expect(median([42])).toBe(42);
  });

  it("returns middle for odd-length array", () => {
    expect(median([1, 3, 5])).toBe(3);
  });

  it("returns average of two middles for even-length array", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("handles unsorted input", () => {
    expect(median([5, 1, 3])).toBe(3);
  });
});

describe("percentile", () => {
  it("returns 0 for empty array", () => {
    expect(percentile([], 90)).toBe(0);
  });

  it("returns the single element for single-element array", () => {
    expect(percentile([100], 90)).toBe(100);
  });

  it("calculates p90 correctly", () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(data, 90)).toBe(9);
    expect(percentile(data, 100)).toBe(10);
  });

  it("calculates p50 (same as median)", () => {
    const data = [10, 20, 30, 40, 50];
    expect(percentile(data, 50)).toBe(30);
  });

  it("handles unsorted input", () => {
    const data = [50, 10, 40, 20, 30];
    expect(percentile(data, 50)).toBe(30);
  });
});

describe("roundTo", () => {
  it("rounds to 1 decimal by default", () => {
    expect(roundTo(3.456)).toBe(3.5);
  });

  it("rounds to specified decimals", () => {
    expect(roundTo(3.456, 2)).toBe(3.46);
  });

  it("rounds to 0 decimals", () => {
    expect(roundTo(3.6, 0)).toBe(4);
  });
});

describe("minutesToHours", () => {
  it("converts minutes to hours rounded to 1 decimal", () => {
    expect(minutesToHours(90)).toBe(1.5);
  });

  it("returns 0 for 0 minutes", () => {
    expect(minutesToHours(0)).toBe(0);
  });

  it("handles large values", () => {
    expect(minutesToHours(2880)).toBe(48);
  });
});
