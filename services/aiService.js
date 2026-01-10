import OpenAI from "openai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: "https://api.fireworks.ai/inference/v1",
});

/**
 * Parse natural language incident description into structured JSON
 * @param {string} description - Natural language description of the incident
 * @returns {Promise<Object>} - Structured incident data
 */
export async function parseIncidentDescription(description) {
  try {
    const response = await client.chat.completions.create({
      model: "accounts/fireworks/models/deepseek-v3p1",
      messages: [
        {
          role: "system",
          content: `You are an emergency response system that extracts structured information from natural language incident reports. 
          Extract all relevant details including incident type, location (latitude and longitude if mentioned, or estimate based on context),
          description, required resources/needs, status, and metadata. 
          If location is not provided, use default coordinates (37.7749, -122.4194) for San Francisco.
          Always set dispatched to false.`
        },
        {
          role: "user",
          content: description,
        },
      ],
      response_format: {
        type: "json_object",
        json_schema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "Type of incident (e.g., Power Outage, Flood, Fire, Earthquake, Medical Emergency, Chemical Spill, Bridge Collapse, Tornado, Gas Leak, Building Collapse, Traffic Accident, Water Main Break, Landslide, or Other)"
            },
            location: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["Point"] },
                coordinates: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 2,
                  maxItems: 2,
                  description: "Longitude and latitude [lng, lat] in GeoJSON format"
                }
              },
              required: ["type", "coordinates"]
            },
            description: {
              type: "string",
              description: "Detailed description of the incident"
            },
            needs: {
              type: "array",
              items: { type: "string" },
              description: "List of required resources, personnel, or equipment needed"
            },
            status: {
              type: "string",
              enum: ["Active", "Triaged", "Resolved"],
              description: "Current status of the incident"
            },
            dispatched: {
              type: "boolean",
              description: "Whether the incident has been dispatched (always false for new incidents)"
            },
            metadata: {
              type: "object",
              properties: {
                source: {
                  type: "string",
                  description: "Source of the incident report (e.g., Emergency Services, 911 Dispatch, LoRa_Mesh, Fire Department)"
                },
                reliability_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: "Reliability score of the report (0.0 to 1.0)"
                }
              }
            }
          },
          required: ["type", "location", "description", "status", "dispatched"]
        },
      },
    });

    const content = response.choices[0].message.content;
    const parsedData = JSON.parse(content);

    // Ensure dispatched is false
    parsedData.dispatched = false;

    // Ensure location is in correct format
    if (!parsedData.location || !parsedData.location.coordinates) {
      parsedData.location = {
        type: "Point",
        coordinates: [-122.4194, 37.7749] // Default to San Francisco
      };
    }

    // Ensure needs is an array
    if (!parsedData.needs || !Array.isArray(parsedData.needs)) {
      parsedData.needs = [];
    }

    // Ensure status has a default
    if (!parsedData.status) {
      parsedData.status = "Active";
    }

    return parsedData;
  } catch (error) {
    console.error('Error parsing incident description with AI:', error);
    throw new Error(`Failed to parse incident: ${error.message}`);
  }
}
