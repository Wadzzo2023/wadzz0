// src/lib/form-agent.ts
import { openai } from "@ai-sdk/openai";
import { generateText, generateObject, streamText } from "ai";
import { z } from "zod";

export type FormField = {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  validation?: string[];
  enum?: string[];
};

const ami = z.object({
  image: z.string({ description: "A AWS Image upload field" }).url(),
  assetImage: z.string({ description: "A PINATA Image upload field" }).url(),
});

export type FormState = {
  schema: z.ZodObject<any>;
  fields: FormField[];
  currentData: Record<string, any>;
  remainingFields: string[];
  errors: Record<string, string>;
  isComplete: boolean;
};

/**
 * Extracts field information from a Zod schema
 */
export function extractFieldsFromSchema(schema: z.ZodObject<any>): FormField[] {
  const shape = schema._def.shape();

  return Object.entries(shape).map(([name, field]) => {
    // @ts-ignore
    const fieldType = field._def.typeName;
    let type = "string";
    let required = true;
    let enumValues: string[] = [];
    const validations: string[] = [];

    let isUpload = false;
    let uploadType = "";

    // Handle optional fields
    if (field instanceof z.ZodOptional) {
      required = false;
      field = field._def.innerType;
    }

    // Get description if available
    if (field instanceof z.ZodString) {
      const fieldDes = field._def.description;

      // Check if this is an upload field based on description
      if (fieldDes)
        if (fieldDes.toLowerCase().includes("upload")) {
          isUpload = true;
          if (fieldDes.toLowerCase().includes("aws")) {
            uploadType = "aws";
          } else if (fieldDes.toLowerCase().includes("pinata")) {
            uploadType = "pinata";
          } else {
            uploadType = "generic";
          }
          type = `upload:${uploadType}`;
        }
    }

    // Extract field type
    if (field instanceof z.ZodString) {
      type = "string";
      const maxLength = field._def.checks?.find((c) => c.kind === "max")?.value;
      if (maxLength) validations.push(`max length ${maxLength}`);
    } else if (field instanceof z.ZodNumber) {
      type = "number";
      const min = field._def.checks?.find((c) => c.kind === "min")?.value;
      const max = field._def.checks?.find((c) => c.kind === "max")?.value;
      if (min !== undefined) validations.push(`min ${min}`);
      if (max !== undefined) validations.push(`max ${max}`);
    } else if (field instanceof z.ZodEnum) {
      type = "enum";
      enumValues = field._def.values;
    } else if (field instanceof z.ZodBoolean) {
      type = "boolean";
    }

    return {
      name,
      type,
      required,
      validation: validations.length > 0 ? validations : undefined,
      enum: enumValues.length > 0 ? enumValues : undefined,
    };
  });
}

/**
 * Initializes the form state based on a Zod schema
 */
export function initializeFormState(schema: z.ZodObject<any>): FormState {
  const fields = extractFieldsFromSchema(schema);
  const remainingFields = fields.filter((f) => f.required).map((f) => f.name);

  return {
    schema,
    fields,
    currentData: {},
    remainingFields,
    errors: {},
    isComplete: false,
  };
}

/**
 * Updates form state with new user input
 */
export function updateFormState(
  state: FormState,
  updates: Record<string, any>,
): FormState {
  const newState = { ...state };

  // Update the current data with all provided values
  newState.currentData = {
    ...newState.currentData,
    ...updates,
  };

  // Remove fields from remaining fields
  const updatedFields = Object.keys(updates);
  newState.remainingFields = newState.remainingFields.filter(
    (field) => !updatedFields.includes(field),
  );

  // Validate the entire form
  try {
    newState.schema.parse(newState.currentData);
    newState.errors = {};
    newState.isComplete = newState.remainingFields.length === 0;
  } catch (error) {
    if (error instanceof z.ZodError) {
      newState.errors = {};
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        newState.errors[field] = err.message;
      });
    }
  }

  return newState;
}

/**
 * Generates the next conversation message based on form state
 */
export async function streamNextPrompt(
  state: FormState,
  userInput: string,
  callback?: (output: string) => void,
) {
  const remainingFieldsInfo = state.fields
    .filter((field) => state.remainingFields.includes(field.name))
    .map((field) => {
      let description = `${field.name} (${field.type})`;
      if (field.validation) description += ` - ${field.validation.join(", ")}`;
      if (field.enum) description += ` - Options: ${field.enum.join(", ")}`;
      return description;
    });

  const prompt = `
You are a helpful AI assistant collecting form information from a user.

Current form state:
${JSON.stringify(state.fields, null, 2)}

Data collected so far:
${JSON.stringify(state.currentData, null, 2)}

Remaining fields to be collected:
${remainingFieldsInfo.join("\n")}

Errors with current data:
${JSON.stringify(state.errors, null, 2)}

User's latest input: "${userInput}"

IMPORTANT FORMATTING INSTRUCTIONS:
1. For any upload fields, use this exact format in your response: "Please upload a file for [fieldName]. UPLOAD_FIELD:[fieldName]"
2. After acknowledging any provided values, use the format "FIELD_UPDATED:[fieldName]:[value]" for each field you've recognized.
3. If all required fields are collected and valid, use the format "PLEASE_CONFIRM" to ask for confirmation.

Your task:
1. Acknowledge any fields the user has just provided.
2. If there are validation errors, explain them clearly.
3. Ask for ALL remaining fields at once (not just one), describing each field's requirements.
4. For upload fields, explicitly mention they need to upload a file and use the UPLOAD_FIELD marker.
5. If all required fields are collected and valid, confirm completion by asking for confirmation using the PLEASE_CONFIRM marker.

Respond in a conversational, helpful tone while including these special markers for the UI to parse.
  `;

  const response = streamText({
    model: openai("gpt-4o"),
    prompt,
    onFinish: (output) => {
      if (callback) {
        callback(output.text);
      }
    },
  });

  return response;
}

/**
 * Extracts multiple field values from user input using AI
 */
export async function extractMultipleValues(
  userInput: string,
  fields: FormField[],
  currentConversation: string[],
): Promise<Record<string, any>> {
  const schema = z.object({
    extractedFields: z.array(
      z.object({
        fieldName: z.string(),
        extractedValue: z.any(),
        confidence: z.number().min(0).max(1),
      }),
    ),
    reasoning: z.string(),
  });

  const prompt = `
You are helping to extract multiple form field values from user inputs.

Available fields:
${JSON.stringify(fields, null, 2)}

Recent conversation:
${currentConversation.join("\n")}

User's latest input: "${userInput}"

Your task:
1. Identify ALL fields the user is providing values for in this input.
2. Extract each value, matching the expected type for that field.
3. Provide confidence level (0-1) for each extraction.
4. Explain your reasoning.

Return a valid JSON object with extractedFields array and reasoning.
  `;

  const result = (
    await generateObject({
      model: openai("gpt-4o"),
      prompt,
      schema,
    })
  ).object;

  // Filter out low-confidence extractions and format results
  const extractedValues: Record<string, any> = {};

  result.extractedFields
    .filter((field) => field.confidence > 0.7)
    .forEach((field) => {
      const fieldDef = fields.find((f) => f.name === field.fieldName);

      if (fieldDef) {
        // Type conversion if needed
        if (
          fieldDef.type === "number" &&
          typeof field.extractedValue === "string"
        ) {
          extractedValues[field.fieldName] = Number(field.extractedValue);
        } else {
          extractedValues[field.fieldName] = field.extractedValue;
        }
      }
    });

  return extractedValues;
}
