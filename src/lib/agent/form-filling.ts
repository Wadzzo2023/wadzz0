// src/lib/form-agent.ts
import { openai } from "@ai-sdk/openai";
import { generateObject, streamText } from "ai";
import { z } from "zod";

export type FormField = {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  validation?: string[];
  enum?: string[];
};

export type FormState = {
  schema: z.ZodObject<any>; // Used only on client-side
  fields: FormField[];
  currentData: Record<string, any>;
  remainingFields: string[];
  errors: Record<string, string>;
  isComplete: boolean;
};

// Type for serializing form state when sending to server
export type SerializedFormState = Omit<FormState, "schema">;

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
  updatedFields?: Record<string, any>,
): FormState {
  const newState = { ...state };

  // Update the current data with all new field values
  newState.currentData = {
    ...newState.currentData,
    ...updates,
  };

  // Process updated fields if provided
  if (updatedFields && Object.keys(updatedFields).length > 0) {
    // Store original values before attempting updates
    const originalValues = { ...newState.currentData };

    // Try applying updates
    const tempData = {
      ...newState.currentData,
      ...updatedFields,
    };

    // Validate updates if schema is available
    if (newState.schema && typeof newState.schema.parse === "function") {
      try {
        // Validate just the updated fields
        const partialSchema = z.object(
          Object.fromEntries(
            Object.keys(updatedFields).map((key) => {
              const fieldDef = newState.schema._def.shape()[key];
              return [key, fieldDef || z.any()];
            }),
          ),
        );

        partialSchema.parse(updatedFields);

        // If validation passes, apply updates
        newState.currentData = tempData;
      } catch (error) {
        // If validation fails, keep original values and record errors
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            const field = err.path[0] as string;
            newState.errors[field] = `Update failed: ${err.message}`;
            // Keep the original value for this field
            if (field in originalValues) {
              newState.currentData[field] = originalValues[field];
            }
          });
        }
      }
    } else {
      // No schema for validation, just apply updates
      newState.currentData = tempData;
    }
  }

  // Remove fields from remaining fields (only for new fields, not updates)
  const newFieldKeys = Object.keys(updates);
  newState.remainingFields = newState.remainingFields.filter(
    (field) => !newFieldKeys.includes(field),
  );

  // Skip full validation if schema is not available (server-side)
  if (!newState.schema || typeof newState.schema.parse !== "function") {
    newState.isComplete = newState.remainingFields.length === 0;
    return newState;
  }

  // Validate the entire form (client-side only)
  try {
    newState.schema.parse(newState.currentData);
    // Clear errors that might have been resolved
    const existingErrorFields = Object.keys(newState.errors);
    existingErrorFields.forEach((field) => {
      // If the field was updated and now validates, clear its error
      if (
        (updates[field] !== undefined ||
          updatedFields?.[field] !== undefined) &&
        !newState.errors[field]?.startsWith("Update failed:")
      ) {
        delete newState.errors[field];
      }
    });

    newState.isComplete = newState.remainingFields.length === 0;
  } catch (error) {
    console.log("validation error", error);
    if (error instanceof z.ZodError) {
      // Keep existing "Update failed" errors and add new validation errors
      const updatedErrors = { ...newState.errors };
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!updatedErrors[field]?.startsWith("Update failed:")) {
          updatedErrors[field] = err.message;
        }
      });
      newState.errors = updatedErrors;
    }
  }

  return newState;
}

/**
 * Generates the next conversation message based on form state
 */
export async function streamNextPrompt(
  state: FormState | SerializedFormState,
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
type FormFieldWithValue = FormField & { value: any };

export async function extractMultipleValues(
  userInput: string,
  remainingField: FormField[],
  fieldAlreadyFilled: FormFieldWithValue[],
  currentConversation: string[],
) {
  const schema = z.object({
    extractedFields: z.object({
      newFields: z.array(
        z.object({
          fieldName: z.string(),
          extractedValue: z.any(),
          confidence: z.number().min(0).max(1),
        }),
      ),
      updatedFields: z.array(
        z.object({
          fieldName: z.string(),
          extractedValue: z.any(),
          confidence: z.number().min(0).max(1),
        }),
      ),
    }),
    reasoning: z.string(),
  });

  const prompt = `
You are helping to extract multiple form field values from user inputs.

Already filled fields:
${fieldAlreadyFilled.map((field) => field.name).join(", ")}

Available fields:
${JSON.stringify(remainingField, null, 2)}

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
      model: openai("gpt-4o-mini"),
      prompt,
      schema,
    })
  ).object;

  // Filter out low-confidence extractions and format results
  const newFieldValues: Record<string, any> = {};
  const updatedFieldValues: Record<string, any> = {};

  result.extractedFields.newFields
    .filter((field) => field.confidence > 0.7)
    .forEach((field) => {
      const fieldDef = remainingField.find((f) => f.name === field.fieldName);

      if (fieldDef) {
        // Type conversion if needed
        if (
          fieldDef.type === "number" &&
          typeof field.extractedValue === "string"
        ) {
          newFieldValues[field.fieldName] = Number(field.extractedValue);
        } else {
          newFieldValues[field.fieldName] = field.extractedValue;
        }
      }
    });

  result.extractedFields.updatedFields
    .filter((field) => field.confidence > 0.7)
    .forEach((field) => {
      const fieldDef = fieldAlreadyFilled.find(
        (f) => f.name === field.fieldName,
      );

      if (fieldDef) {
        // Type conversion if needed
        if (
          fieldDef.type === "number" &&
          typeof field.extractedValue === "string"
        ) {
          updatedFieldValues[field.fieldName] = Number(field.extractedValue);
        } else {
          updatedFieldValues[field.fieldName] = field.extractedValue;
        }
      }
    });

  return { newFieldValues, updatedFieldValues };
}
