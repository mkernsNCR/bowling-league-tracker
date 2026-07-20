import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const openAIMocks = vi.hoisted(() => ({
  constructor: vi.fn(),
  createCompletion: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    readonly chat = {
      completions: {
        create: openAIMocks.createCompletion,
      },
    };

    constructor(options: unknown) {
      openAIMocks.constructor(options);
    }
  },
}));

const environmentKeys = [
  "AI_INTEGRATIONS_OPENAI_API_KEY",
  "AI_INTEGRATIONS_OPENAI_BASE_URL",
  "OPENAI_API_KEY",
  "OPENAI_API_BASE_URL",
] as const;

const originalEnvironment = Object.fromEntries(
  environmentKeys.map((key) => [key, process.env[key]]),
);

async function loadOcrModule() {
  return import("../server/ocr");
}

describe("OCR OpenAI client configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    openAIMocks.constructor.mockClear();
    openAIMocks.createCompletion.mockReset();

    for (const key of environmentKeys) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of environmentKeys) {
      const originalValue = originalEnvironment[key];
      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    }
  });

  it("reuses the lazily created client across OCR calls", async () => {
    process.env.OPENAI_API_KEY = "standard-key";
    openAIMocks.createCompletion
      .mockResolvedValueOnce({ choices: [{ message: { content: '{"bowlers":[]}' } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: '{"scores":[]}' } }] });

    const { extractRosterFromImage, extractScoresFromImage } = await loadOcrModule();
    await extractRosterFromImage("roster-image");
    await extractScoresFromImage("scores-image");

    expect(openAIMocks.constructor).toHaveBeenCalledTimes(1);
    expect(openAIMocks.createCompletion).toHaveBeenCalledTimes(2);
  });

  it("prefers AI integration credentials and base URL", async () => {
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "integration-key";
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "https://integration.example/v1";
    process.env.OPENAI_API_KEY = "standard-key";
    process.env.OPENAI_API_BASE_URL = "https://standard.example/v1";
    openAIMocks.createCompletion.mockResolvedValue({
      choices: [{ message: { content: '{"bowlers":[]}' } }],
    });

    const { extractRosterFromImage } = await loadOcrModule();
    await extractRosterFromImage("roster-image");

    expect(openAIMocks.constructor).toHaveBeenCalledWith({
      apiKey: "integration-key",
      baseURL: "https://integration.example/v1",
    });
  });

  it("falls back to standard OpenAI configuration", async () => {
    process.env.OPENAI_API_KEY = "standard-key";
    process.env.OPENAI_API_BASE_URL = "https://standard.example/v1";
    openAIMocks.createCompletion.mockResolvedValue({
      choices: [{ message: { content: '{"bowlers":[]}' } }],
    });

    const { extractRosterFromImage } = await loadOcrModule();
    await extractRosterFromImage("roster-image");

    expect(openAIMocks.constructor).toHaveBeenCalledWith({
      apiKey: "standard-key",
      baseURL: "https://standard.example/v1",
    });
  });

  it("allows the base URL to be omitted", async () => {
    process.env.OPENAI_API_KEY = "standard-key";
    openAIMocks.createCompletion.mockResolvedValue({
      choices: [{ message: { content: '{"bowlers":[]}' } }],
    });

    const { extractRosterFromImage } = await loadOcrModule();
    await extractRosterFromImage("roster-image");

    expect(openAIMocks.constructor).toHaveBeenCalledWith({
      apiKey: "standard-key",
      baseURL: undefined,
    });
  });

  it("throws a clear error when neither API key is configured", async () => {
    const { extractRosterFromImage } = await loadOcrModule();

    await expect(extractRosterFromImage("roster-image")).rejects.toThrow(
      "AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY environment variable is required for OCR features",
    );
    expect(openAIMocks.constructor).not.toHaveBeenCalled();
  });
});
