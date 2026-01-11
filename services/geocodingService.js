import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyB1QfE_o2BhuUebPIXRGWYmqSxzIOsuHmg';

/**
 * Geocode an address using Google Maps Geocoding API
 * @param {string} address - Address string to geocode
 * @param {Object} regionBias - Optional region bias { lat: number, lng: number } to improve accuracy
 * @returns {Promise<Object>} - { lat: number, lng: number, formatted_address: string } or null if not found
 */
export async function geocodeAddress(address, regionBias = null) {
  try {
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return null;
    }

    let addressToGeocode = address.trim();
    
    // Add location context to improve accuracy when user location is known
    if (regionBias && regionBias.lat && regionBias.lng) {
      // If address doesn't already include a city, add "San Francisco" for better accuracy
      // (assuming most incidents are in SF area based on default coordinates)
      if (!addressToGeocode.match(/San Francisco|SF|Oakland|Berkeley|California|CA/i)) {
        addressToGeocode = `${addressToGeocode}, San Francisco, CA`;
      }
    }
    
    let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToGeocode)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    // Add region bias (US) for better accuracy with US addresses
    url += `&region=us`;
    
    // Add bounds bias if user location is provided (helps with ambiguous addresses)
    // Bounds format: southwest_lat,southwest_lng|northeast_lat,northeast_lng
    if (regionBias && regionBias.lat && regionBias.lng) {
      const latOffset = 0.1; // ~11km radius for better coverage
      const lngOffset = 0.1;
      const swLat = regionBias.lat - latOffset;
      const swLng = regionBias.lng - lngOffset;
      const neLat = regionBias.lat + latOffset;
      const neLng = regionBias.lng + lngOffset;
      url += `&bounds=${swLat},${swLng}|${neLat},${neLng}`;
    }

    console.log(`[Geocoding] Geocoding address: ${address}`);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      const coordinates = {
        lat: location.lat,
        lng: location.lng,
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        location_type: result.geometry.location_type // ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE
      };
      console.log(`[Geocoding] Found coordinates for "${address}":`, coordinates);
      return coordinates;
    } else if (data.status === 'ZERO_RESULTS') {
      console.log(`[Geocoding] No results found for address: ${address}`);
      return null;
    } else {
      console.warn(`[Geocoding] Geocoding error for "${address}":`, data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error(`[Geocoding] Error geocoding address "${address}":`, error);
    return null;
  }
}

/**
 * Try multiple variations of an address to improve geocoding success
 * @param {string} address - Base address string
 * @param {Object} regionBias - Optional region bias
 * @returns {Promise<Object>} - Geocoded result or null
 */
export async function geocodeAddressWithVariations(address, regionBias = null) {
  if (!address || typeof address !== 'string') {
    return null;
  }

  // Try the original address first
  let result = await geocodeAddress(address, regionBias);
  if (result) {
    return result;
  }

  // Try variations with better context
  const variations = [
    address, // Try original first
    // Add city and state if not present
    !address.match(/San Francisco|SF|Oakland|Berkeley|California|CA/i) 
      ? `${address}, San Francisco, CA` 
      : address,
    // Add just state if city but no state
    address.match(/San Francisco|SF|Oakland|Berkeley/i) && !address.match(/CA|California/i)
      ? `${address}, CA`
      : address,
    // Try with zip code pattern removed if present
    address.replace(/\s+\d{5}(-\d{4})?$/, ''),
    // Try without trailing punctuation
    address.replace(/[.,;:!?]+$/, ''),
  ];
  
  // Remove duplicates
  const uniqueVariations = [...new Set(variations)];

  for (const variation of uniqueVariations) {
    if (variation !== address && variation.trim().length > 0) {
      result = await geocodeAddress(variation, regionBias);
      if (result) {
        console.log(`[Geocoding] Success with variation: "${variation}"`);
        return result;
      }
    }
  }

  return null;
}

/**
 * Extract potential addresses from text using common patterns
 * @param {string} text - Text to search for addresses
 * @returns {Array<string>} - Array of potential address strings
 */
export function extractAddressesFromText(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const addressPatterns = [
    // Full addresses with street number, name, and city/state: "123 Main St, San Francisco, CA"
    /\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Circle|Cir|Highway|Hwy|Parkway|Pkwy)[,\s]+[A-Za-z\s]+(?:,\s*[A-Z]{2})?(?:\s+\d{5})?/gi,
    // Street addresses: "123 Main Street", "456 Oak Ave", etc.
    /\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Circle|Cir|Highway|Hwy|Parkway|Pkwy)\b/gi,
    // Intersections: "Main St and Oak Ave", "5th and Market"
    /(?:[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)|(?:\d+(?:st|nd|rd|th)?))\s+and\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)/gi,
    // Addresses with "at" or "on": "at 123 Main St", "on Market Street"
    /(?:at|on)\s+(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Circle|Cir))/gi,
    // ZIP codes: "94102", "94102-1234"
    /\b\d{5}(-\d{4})?\b/g,
    // City names with "in" or "at": "in San Francisco", "at Oakland", "near Berkeley"
    /(?:in|at|near|on|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    // Landmarks and places: "Golden Gate Bridge", "Central Park", "AT&T Park"
    /(?:at|near|by)\s+([A-Z][a-z&]+(?:\s+[A-Z][a-z]+)+)/g,
    // Neighborhoods: "Mission District", "SOMA", "Financial District"
    /(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:District|Area|Neighborhood|Neighborhoods))/gi,
  ];

  const addresses = new Set();

  addressPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Clean up the match
        let cleaned = match.trim();
        // Remove leading "in", "at", "near", "on", "by"
        cleaned = cleaned.replace(/^(in|at|near|on|by)\s+/i, '');
        // Remove trailing punctuation
        cleaned = cleaned.replace(/[.,;:!?]+$/, '');
        if (cleaned.length > 3) { // Only add if it's a reasonable length
          addresses.add(cleaned);
        }
      });
    }
  });

  return Array.from(addresses);
}
