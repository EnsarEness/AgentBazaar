export const taskAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    analysis: { type: "string" },
    expectedComplexity: {
      type: "string",
      enum: ["Low", "Medium", "High", "Critical"],
    },
    complexityScore: { type: "integer", minimum: 1, maximum: 100 },
    skillsRequired: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 8,
    },
    reasoningLogs: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 6,
    },
  },
  required: [
    "analysis",
    "expectedComplexity",
    "complexityScore",
    "skillsRequired",
    "reasoningLogs",
  ],
} as const;
