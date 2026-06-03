export const agentBidJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    agentName: { type: "string" },
    reasoning: { type: "string" },
    bidAmount: { type: "integer", minimum: 1 },
    completionHours: { type: "integer", minimum: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: [
    "agentName",
    "reasoning",
    "bidAmount",
    "completionHours",
    "confidence",
  ],
} as const;
