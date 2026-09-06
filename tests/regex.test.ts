import {
  EMAIL_REGEX,
  EXPERIENCE_REGEX,
  PHONE_REGEX,
} from "../src/modules/ingestion/utils/regex";

describe("resume regex utilities", () => {
  it("extracts an email address", () => {
    expect("Contact rajesh.kumar@example.com".match(EMAIL_REGEX)?.[0]).toBe(
      "rajesh.kumar@example.com",
    );
  });

  it("extracts an Indian phone number", () => {
    expect("Call +91 9876543210".match(PHONE_REGEX)?.[0]).toBe(
      "+91 9876543210",
    );
  });

  it("extracts numeric years of experience", () => {
    const match = "13+ years of experience".match(EXPERIENCE_REGEX);
    expect(match?.[1]).toBe("13");
    expect(Number(match?.[1])).toBe(13);
  });
});
