/**
 * Gemini Live API function calling declarations.
 *
 * These mirror the TOOL_DESCRIPTIONS in tools.ts but use the Gemini
 * function calling schema format for the Live API WebSocket session.
 */

export const LIVE_FUNCTION_DECLARATIONS = [
  {
    name: "highlight_node",
    description:
      "Highlight a trait node on the 3D body visualization to draw the user's attention to a specific health trait.",
    parameters: {
      type: "OBJECT",
      properties: {
        traitId: {
          type: "STRING",
          enum: [
            "caffeine_sensitivity",
            "carb_tolerance",
            "fat_metabolism",
            "inflammation_tendency",
            "recovery_rate",
            "sleep_quality_tendency",
          ],
          description: "The trait to highlight on the body map",
        },
      },
      required: ["traitId"],
    },
  },
  {
    name: "run_simulation",
    description:
      "Run a what-if simulation showing how a lifestyle change affects health metrics.",
    parameters: {
      type: "OBJECT",
      properties: {
        scenario: {
          type: "STRING",
          enum: [
            "reduce_caffeine",
            "high_protein",
            "intermittent_fasting",
            "increase_sleep",
            "high_carb",
          ],
          description: "The scenario to simulate",
        },
      },
      required: ["scenario"],
    },
  },
  {
    name: "add_to_cart",
    description: "Add a supplement or product to the user's plan cart.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: {
          type: "STRING",
          description: "Name of the product to add",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "open_concierge",
    description:
      "Connect the user with a live 10X Health concierge for questions beyond the agent's scope.",
    parameters: {
      type: "OBJECT",
      properties: {
        context: {
          type: "STRING",
          description: "Brief summary of the conversation so far",
        },
      },
      required: ["context"],
    },
  },
  {
    name: "show_daily_plan",
    description: "Show the user's personalized daily health plan.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "generate_meal_image",
    description:
      "Generate a photo-realistic image of a meal or dish. Use when the user asks to see what a recommended meal looks like, or asks you to show them a recipe or food idea.",
    parameters: {
      type: "OBJECT",
      properties: {
        description: {
          type: "STRING",
          description:
            "Detailed description of the meal — ingredients, cooking style, plating. E.g. 'grilled salmon fillet with roasted asparagus, quinoa, and lemon butter sauce on a white plate'",
        },
      },
      required: ["description"],
    },
  },
];
