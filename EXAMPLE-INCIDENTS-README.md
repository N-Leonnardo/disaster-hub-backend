# Example Incidents Data

This directory contains example incident data that you can use to populate your database for testing.

## Files

- `example-incidents.json` - Contains 10 example incidents in GeoJSON format
- `scripts/insert-example-incidents.js` - Script to insert the examples into your database

## Incident Data Format

Each incident follows this structure:

```json
{
  "_id": "unique-id",
  "type": "Incident Type",
  "location": {
    "type": "Point",
    "coordinates": [longitude, latitude]  // Note: GeoJSON format is [lng, lat]
  },
  "description": "Detailed description of the incident",
  "needs": ["Resource1", "Resource2"],
  "status": "Active | Triaged | Resolved",
  "metadata": {
    "source": "Data source",
    "reliability_score": 0.0-1.0
  }
}
```

## How to Insert Example Data

### Option 1: Using npm script (Recommended)

```bash
npm run insert-examples
```

### Option 2: Using Node directly

```bash
node scripts/insert-example-incidents.js
```

### Option 3: Using cURL to insert via API

You can insert incidents one by one using the API:

```bash
curl -X POST http://localhost:3000/api/incident \
  -H "Content-Type: application/json" \
  -d @example-incidents.json
```

Or insert a single incident:

```bash
curl -X POST http://localhost:3000/api/incident \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "type": "Power Outage",
    "location": {
      "type": "Point",
      "coordinates": [-122.4194, 37.7749]
    },
    "description": "Hospital backup generator failing, 20 patients at risk.",
    "needs": ["Generator", "Electrician"],
    "status": "Triaged",
    "metadata": {
      "source": "LoRa_Mesh",
      "reliability_score": 0.85
    }
  }'
```

## Example Incidents Included

1. **Power Outage** - Hospital generator failure (San Francisco)
2. **Flood** - Flash flooding in residential area
3. **Fire** - Wildfire near residential area
4. **Earthquake** - Magnitude 5.2 earthquake
5. **Medical Emergency** - Mass casualty at sports stadium
6. **Chemical Spill** - Hazardous material spill
7. **Power Outage** - Large-scale outage affecting 5000+ homes
8. **Bridge Collapse** - Structural failure with trapped vehicles
9. **Tornado** - Tornado touchdown with property damage
10. **Gas Leak** - Natural gas leak requiring evacuation

All incidents are located in the San Francisco Bay Area for easy testing on the map.

## Location Format

The frontend now supports both location formats:

1. **GeoJSON format** (used by backend):
   ```json
   {
     "type": "Point",
     "coordinates": [-122.4194, 37.7749]  // [longitude, latitude]
   }
   ```

2. **Lat/Lng format** (also supported):
   ```json
   {
     "lat": 37.7749,
     "lng": -122.4194
   }
   ```

## Notes

- The script will skip duplicate incidents (based on `_id`)
- Make sure your MongoDB connection is working before running the script
- The database name defaults to `test` - modify the script if you use a different database name
- All coordinates are in the San Francisco Bay Area for easy visualization
