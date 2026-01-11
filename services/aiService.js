import OpenAI from "openai";
import dotenv from 'dotenv';
import { geocodeAddress, geocodeAddressWithVariations, extractAddressesFromText } from './geocodingService.js';

// Load environment variables
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: "https://api.fireworks.ai/inference/v1",
});

/**
 * Extract location information using AI
 * @param {string} description - Incident description
 * @returns {Promise<string|null>} - Location string or null
 */
async function extractLocationWithAI(description) {
  try {
    const response = await client.chat.completions.create({
      model: "accounts/fireworks/models/deepseek-v3p1",
      messages: [
        {
          role: "system",
          content: `You are a location extraction assistant. Extract the location, address, landmark, or place name mentioned in the text. 
          Return ONLY the location string (address, landmark, city, intersection, etc.) without any additional text.
          If no location is mentioned, return null.`
        },
        {
          role: "user",
          content: `Extract the location from this incident report: ${description}`
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });

    const locationString = response.choices[0].message.content.trim();
    
    // Clean up the response
    if (locationString && locationString.toLowerCase() !== 'null' && locationString.length > 2) {
      // Remove quotes if present
      const cleaned = locationString.replace(/^["']|["']$/g, '');
      return cleaned.length > 2 ? cleaned : null;
    }
    
    return null;
  } catch (error) {
    console.error('[AI Service] Error extracting location with AI:', error);
    return null;
  }
}

/**
 * Parse natural language incident description into structured JSON
 * @param {string} description - Natural language description of the incident
 * @param {Object} userLocation - Optional user location { lat: number, lng: number }
 * @returns {Promise<Object>} - Structured incident data
 */
export async function parseIncidentDescription(description, userLocation = null) {
  try {
    // First, try to extract and geocode addresses from the description
    let geocodedLocation = null;
    const potentialAddresses = extractAddressesFromText(description);
    
    console.log('[AI Service] Extracted potential addresses:', potentialAddresses);
    
    // Use user location as region bias for better geocoding accuracy
    const regionBias = userLocation && userLocation.lat && userLocation.lng ? userLocation : null;
    
    // Try to geocode each potential address with variations
    for (const address of potentialAddresses) {
      geocodedLocation = await geocodeAddressWithVariations(address, regionBias);
      if (geocodedLocation) {
        console.log('[AI Service] Successfully geocoded address:', address);
        break; // Use the first successfully geocoded address
      }
    }
    
    // If regex extraction didn't work, ask AI to extract location string
    if (!geocodedLocation) {
      console.log('[AI Service] No address found via regex, asking AI to extract location...');
      const aiLocationString = await extractLocationWithAI(description);
      if (aiLocationString) {
        console.log('[AI Service] AI extracted location string:', aiLocationString);
        geocodedLocation = await geocodeAddressWithVariations(aiLocationString, regionBias);
      }
    }

    // Build location context for AI
    let locationContext = '';
    if (geocodedLocation) {
      locationContext = `A specific address was found in the description and has been geocoded to latitude ${geocodedLocation.lat}, longitude ${geocodedLocation.lng}. Use these coordinates for the incident location.`;
    } else if (userLocation && userLocation.lat && userLocation.lng) {
      locationContext = `No specific address was mentioned in the description. The user reporting this incident is located at latitude ${userLocation.lat}, longitude ${userLocation.lng}. Use the user's location as the incident location.`;
    } else {
      locationContext = `If location is not provided in the description, use default coordinates (37.7749, -122.4194) for San Francisco.`;
    }

    const response = await client.chat.completions.create({
      model: "accounts/fireworks/models/deepseek-v3p1",
      messages: [
        {
          role: "system",
          content: `You are an emergency response system that extracts structured information from natural language incident reports. 
          Extract all relevant details including incident type, location (latitude and longitude if mentioned, or estimate based on context),
          description, required resources/needs, status, and metadata. 
          ${locationContext}
          Always set dispatched to false.
          Reply in JSON format matching the provided schema.`
        },
        {
          role: "user",
          content: description,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "incident",
          schema: {
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
          }
        },
      },
    });

    const content = response.choices[0].message.content;
    const parsedData = JSON.parse(content);

    // Ensure dispatched is false
    parsedData.dispatched = false;

    // Determine final location: prioritize geocoded address, then user location, then default
    if (geocodedLocation) {
      // Use geocoded address location (most accurate)
      parsedData.location = {
        type: "Point",
        coordinates: [geocodedLocation.lng, geocodedLocation.lat] // GeoJSON format: [lng, lat]
      };
      console.log('[AI Service] Using geocoded address location:', parsedData.location);
    } else if (userLocation && userLocation.lat && userLocation.lng) {
      // Use user location if no address was found
      parsedData.location = {
        type: "Point",
        coordinates: [userLocation.lng, userLocation.lat] // GeoJSON format: [lng, lat]
      };
      console.log('[AI Service] Using user location (no address found):', parsedData.location);
    } else {
      // Fallback to default or AI-extracted location
      if (!parsedData.location || !parsedData.location.coordinates) {
        parsedData.location = {
          type: "Point",
          coordinates: [-122.4194, 37.7749] // Default to San Francisco
        };
        console.log('[AI Service] Using default location (San Francisco)');
      } else {
        console.log('[AI Service] Using AI-extracted location:', parsedData.location);
      }
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
