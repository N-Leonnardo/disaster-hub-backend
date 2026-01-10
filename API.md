# Disaster Hub API Documentation

## Base URL
```
http://localhost:3000
```

## Overview
The Disaster Hub API provides RESTful endpoints for managing disaster response resources including inventory, volunteers, incidents, and missions. The API also includes AI-powered incident creation using Fireworks.ai for natural language processing, real-time WebSocket updates, and comprehensive incident management with dispatch tracking.

## Table of Contents
- [General Information](#general-information)
- [Inventory Endpoints](#inventory-endpoints)
- [Volunteer Endpoints](#volunteer-endpoints)
- [Incident Endpoints](#incident-endpoints)
- [Mission Endpoints](#mission-endpoints)
- [WebSocket Updates](#websocket-updates)
- [Other Endpoints](#other-endpoints)
- [Response Format](#response-format)
- [Error Handling](#error-handling)

---

## General Information

### Authentication
Currently, the API does not require authentication. All endpoints are publicly accessible.

### Content Type
All requests and responses use `application/json`.

### Response Format
All successful responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "count": 0  // Only for list endpoints
}
```

Error responses follow this structure:
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Inventory Endpoints

Base path: `/api/inventory`

### Get All Inventory Items
Retrieve all inventory items from the database.

**Endpoint:** `GET /api/inventory`

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "inv_101",
      "item_name": "Industrial Generator 50kW",
      "category": "Power",
      "description": "High-capacity diesel generator suitable for hospitals or shelters.",
      "description_embedding": [0.12, -0.98, 0.45],
      "total_quantity": 5,
      "available_quantity": 2,
      "allocated_quantity": 3,
      "location_details": {
        "warehouse_id": "wh_north_oakland",
        "bin_number": "A-12",
        "geo_location": {
          "type": "Point",
          "coordinates": [-122.2711, 37.8044]
        }
      },
      "status": "In-Stock",
      "tags": ["Essential", "Heavy-Equipment", "Power"]
    }
  ]
}
```

**Example using cURL:**
```bash
curl http://localhost:3000/api/inventory
```

---

### Get Inventory Item by ID
Retrieve a specific inventory item by its ID.

**Endpoint:** `GET /api/inventory/:id`

**Parameters:**
- `id` (path parameter) - The inventory item ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "inv_101",
    "item_name": "Industrial Generator 50kW",
    ...
  }
}
```

**Example using cURL:**
```bash
curl http://localhost:3000/api/inventory/inv_101
```

---

### Create New Inventory Item
Create a new inventory item.

**Endpoint:** `POST /api/inventory`

**Request Body:**
```json
{
  "_id": "inv_102",
  "item_name": "Portable Water Filter",
  "category": "Water",
  "description": "Portable water filtration system for emergency use.",
  "description_embedding": [0.25, -0.75, 0.30],
  "total_quantity": 10,
  "available_quantity": 10,
  "allocated_quantity": 0,
  "location_details": {
    "warehouse_id": "wh_south_oakland",
    "bin_number": "B-05",
    "geo_location": {
      "type": "Point",
      "coordinates": [-122.2800, 37.7900]
    }
  },
  "status": "In-Stock",
  "tags": ["Essential", "Water", "Portable"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "inv_102",
    ...
  }
}
```

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "inv_102",
    "item_name": "Portable Water Filter",
    "category": "Water",
    "total_quantity": 10,
    "available_quantity": 10,
    "allocated_quantity": 0,
    "status": "In-Stock"
  }'
```

---

### Update Inventory Item
Update an existing inventory item.

**Endpoint:** `PUT /api/inventory/:id`

**Parameters:**
- `id` (path parameter) - The inventory item ID

**Request Body:** (Only include fields you want to update)
```json
{
  "status": "Out-of-Stock",
  "available_quantity": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "inv_101",
    "status": "Out-of-Stock",
    "available_quantity": 0,
    ...
  }
}
```

**Example using cURL:**
```bash
curl -X PUT http://localhost:3000/api/inventory/inv_101 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Out-of-Stock",
    "available_quantity": 0
  }'
```

---

### Delete Inventory Item
Delete an inventory item by ID.

**Endpoint:** `DELETE /api/inventory/:id`

**Parameters:**
- `id` (path parameter) - The inventory item ID

**Response:**
```json
{
  "success": true,
  "message": "Inventory item deleted successfully",
  "data": {
    "_id": "inv_101",
    ...
  }
}
```

**Example using cURL:**
```bash
curl -X DELETE http://localhost:3000/api/inventory/inv_101
```

---

## Volunteer Endpoints

Base path: `/api/volunteer`

### Get All Volunteers
Retrieve all volunteers from the database.

**Endpoint:** `GET /api/volunteer`

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6a7b8c9d111",
      "name": "Volunteer Dave",
      "status": "Available",
      "contact": {
        "phone": "555-0199",
        "radio_handle": "Sierra-Alpha-1"
      },
      "location": {
        "type": "Point",
        "coordinates": [-122.4205, 37.7735]
      },
      "capabilities": [
        "EMT-Basic",
        "4x4 Vehicle",
        "Bilingual-Spanish",
        "Certified Chainsaw Op"
      ],
      "capabilities_embedding": [0.012, -0.54, 0.22],
      "inventory_carried": [
        {
          "item": "Medical Kit - Advanced",
          "qty": 1,
          "unit": "kit"
        },
        {
          "item": "Potable Water",
          "qty": 10,
          "unit": "gallons"
        }
      ],
      "equipment": {
        "vehicle": "Toyota Tacoma",
        "comms": "Meshtastic LoRa Node",
        "power": "100W Solar Folder"
      },
      "metadata": {
        "last_sync": "2026-01-10T11:20:00Z",
        "battery_level": 82,
        "is_offline": false
      }
    }
  ]
}
```

**Example using cURL:**
```bash
curl http://localhost:3000/api/volunteer
```

---

### Get Volunteer by ID
Retrieve a specific volunteer by their ID.

**Endpoint:** `GET /api/volunteer/:id`

**Example using cURL:**
```bash
curl http://localhost:3000/api/volunteer/65a1b2c3d4e5f6a7b8c9d111
```

---

### Create New Volunteer
Create a new volunteer record.

**Endpoint:** `POST /api/volunteer`

**Request Body:**
```json
{
  "_id": "65a1b2c3d4e5f6a7b8c9d222",
  "name": "Volunteer Jane",
  "status": "Available",
  "contact": {
    "phone": "555-0200",
    "radio_handle": "Sierra-Bravo-2"
  },
  "location": {
    "type": "Point",
    "coordinates": [-122.4100, 37.7800]
  },
  "capabilities": ["EMT-Advanced", "Drone Operator"],
  "capabilities_embedding": [0.15, -0.60, 0.30],
  "inventory_carried": [],
  "equipment": {
    "vehicle": "Ford F-150",
    "comms": "Satellite Phone"
  },
  "metadata": {
    "last_sync": "2026-01-10T12:00:00Z",
    "battery_level": 95,
    "is_offline": false
  }
}
```

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/volunteer \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "65a1b2c3d4e5f6a7b8c9d222",
    "name": "Volunteer Jane",
    "status": "Available"
  }'
```

---

### Update Volunteer
Update an existing volunteer record.

**Endpoint:** `PUT /api/volunteer/:id`

**Example using cURL:**
```bash
curl -X PUT http://localhost:3000/api/volunteer/65a1b2c3d4e5f6a7b8c9d111 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "On-Mission",
    "metadata": {
      "battery_level": 75,
      "last_sync": "2026-01-10T13:00:00Z"
    }
  }'
```

---

### Delete Volunteer
Delete a volunteer record by ID.

**Endpoint:** `DELETE /api/volunteer/:id`

**Example using cURL:**
```bash
curl -X DELETE http://localhost:3000/api/volunteer/65a1b2c3d4e5f6a7b8c9d111
```

---

## Incident Endpoints

Base path: `/api/incident`

### Get All Incidents
Retrieve all incidents from the database.

**Endpoint:** `GET /api/incident`

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "type": "Power Outage",
      "location": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]
      },
      "description": "Hospital backup generator failing, 20 patients at risk.",
      "needs": ["Generator", "Electrician"],
      "status": "Triaged",
      "dispatched": false,
      "metadata": {
        "source": "LoRa_Mesh",
        "reliability_score": 0.85
      }
    }
  ]
}
```

**Example using cURL:**
```bash
curl http://localhost:3000/api/incident
```

---

### Get Incident by ID
Retrieve a specific incident by its ID.

**Endpoint:** `GET /api/incident/:id`

**Example using cURL:**
```bash
curl http://localhost:3000/api/incident/65a1b2c3d4e5f6a7b8c9d0e1
```

---

### Create New Incident
Create a new incident record with structured data.

**Endpoint:** `POST /api/incident`

**Request Body:**
```json
{
  "_id": "65a1b2c3d4e5f6a7b8c9d0e2",
  "type": "Flood",
  "location": {
    "type": "Point",
    "coordinates": [-122.4000, 37.7700]
  },
  "description": "Flash flooding in residential area, multiple homes affected.",
  "needs": ["Sandbags", "Pumps", "Rescue Boats"],
  "status": "Active",
  "dispatched": false,
  "metadata": {
    "source": "Emergency Services",
    "reliability_score": 0.95
  }
}
```

**Required Fields:**
- `type` - Type of incident (string)
- `location` - GeoJSON Point with coordinates [longitude, latitude]
- `description` - Detailed description of the incident (string)
- `status` - Current status: "Active", "Triaged", or "Resolved" (string)
- `dispatched` - Whether the incident has been dispatched (boolean, defaults to false)

**Optional Fields:**
- `_id` - Custom ID (string, auto-generated if not provided)
- `needs` - Array of required resources/personnel (array of strings)
- `metadata` - Additional metadata object with `source` and `reliability_score`

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/incident \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "65a1b2c3d4e5f6a7b8c9d0e2",
    "type": "Flood",
    "location": {
      "type": "Point",
      "coordinates": [-122.4000, 37.7700]
    },
    "description": "Flash flooding in residential area",
    "status": "Active",
    "dispatched": false
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e2",
    "type": "Flood",
    "location": {
      "type": "Point",
      "coordinates": [-122.4000, 37.7700]
    },
    "description": "Flash flooding in residential area",
    "needs": [],
    "status": "Active",
    "dispatched": false,
    "metadata": {}
  }
}
```

---

### Create Incident from Natural Language (AI-Powered)
Create a new incident by providing a natural language description. The AI will automatically extract structured information including type, location, description, needs, status, and metadata.

**Endpoint:** `POST /api/incident/from-text`

**Request Body:**
```json
{
  "description": "There's a fire at 123 Main Street in San Francisco. Multiple buildings are affected and we need firefighters, water trucks, and evacuation buses immediately. The fire started about 10 minutes ago and is spreading rapidly."
}
```

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/incident/from-text \
  -H "Content-Type: application/json" \
  -d '{
    "description": "There is a power outage at the hospital on Market Street. The backup generator is failing and 20 patients are at risk. We need an electrician and a generator immediately."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Incident created successfully from description",
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e3",
    "type": "Power Outage",
    "location": {
      "type": "Point",
      "coordinates": [-122.4194, 37.7749]
    },
    "description": "Power outage at the hospital on Market Street. The backup generator is failing and 20 patients are at risk.",
    "needs": ["Electrician", "Generator"],
    "status": "Active",
    "dispatched": false,
    "metadata": {
      "source": "User Report",
      "reliability_score": 0.85
    }
  }
}
```

**AI Capabilities:**
- Automatically extracts incident type from description
- Infers location coordinates from addresses or landmarks
- Identifies required resources and personnel from context
- Determines appropriate status based on urgency
- Estimates reliability score based on information quality
- Extracts source information if mentioned

**Tips for Best Results:**
- Include specific location (address, landmark, or coordinates)
- Mention what resources or personnel are needed
- Describe the urgency and current situation
- Include any relevant details about the incident

---

### Update Incident
Update an existing incident record. You can update any field including the `dispatched` status.

**Endpoint:** `PUT /api/incident/:id`

**Parameters:**
- `id` (path parameter) - The incident ID (string or MongoDB ObjectId)

**Request Body:** (Only include fields you want to update)
```json
{
  "status": "Resolved",
  "dispatched": true
}
```

**Special Behavior:**
- When `dispatched` is set to `true`, the API automatically broadcasts a `reload` message to all WebSocket clients, prompting them to refresh their data.

**Example using cURL:**
```bash
# Update incident status
curl -X PUT http://localhost:3000/api/incident/65a1b2c3d4e5f6a7b8c9d0e1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Resolved"
  }'

# Dispatch an incident
curl -X PUT http://localhost:3000/api/incident/65a1b2c3d4e5f6a7b8c9d0e1 \
  -H "Content-Type: application/json" \
  -d '{
    "dispatched": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "type": "Power Outage",
    "status": "Resolved",
    "dispatched": true,
    ...
  }
}
```

---

### Delete Incident
Delete an incident record by ID.

**Endpoint:** `DELETE /api/incident/:id`

**Example using cURL:**
```bash
curl -X DELETE http://localhost:3000/api/incident/65a1b2c3d4e5f6a7b8c9d0e1
```

---

## WebSocket Updates

The Disaster Hub API provides real-time updates via WebSocket connections. All clients connected to the WebSocket server receive automatic notifications when incidents, volunteers, or missions are created, updated, or deleted.

### WebSocket Connection

**Endpoint:** `ws://localhost:3000/ws` (or `wss://` for HTTPS)

**Connection Example (JavaScript):**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received update:', data);
};
```

### WebSocket Message Types

#### Incident Events

**`incident_created`** - New incident created
```json
{
  "type": "incident_created",
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "type": "Fire",
    "location": { ... },
    "description": "...",
    "status": "Active",
    "dispatched": false,
    ...
  }
}
```

**`incident_updated`** - Incident updated
```json
{
  "type": "incident_updated",
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "status": "Triaged",
    "dispatched": true,
    ...
  }
}
```

**`incident_deleted`** - Incident deleted
```json
{
  "type": "incident_deleted",
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1"
  }
}
```

#### Reload Event

**`reload`** - Broadcast when clients should refresh their data
```json
{
  "type": "reload",
  "reload": true
}
```

This message is automatically sent when an incident is dispatched (when `dispatched` is set to `true` via the update endpoint).

#### Volunteer Events

- `volunteer_created` - New volunteer added
- `volunteer_updated` - Volunteer information updated
- `volunteer_deleted` - Volunteer removed

#### Mission Events

- `mission_created` - New mission created
- `mission_updated` - Mission status updated
- `mission_deleted` - Mission deleted

### Connection Status

**`connected`** - Welcome message sent when client connects
```json
{
  "type": "connected",
  "message": "Connected to Disaster Hub WebSocket server",
  "clientId": 1,
  "timestamp": "2026-01-10T20:12:34.940Z"
}
```

---

## Mission Endpoints

Base path: `/api/mission`

### Get All Missions
Retrieve all missions from the database.

**Endpoint:** `GET /api/mission`

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "mission_555",
      "incident_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "volunteer_id": "65a1b2c3d4e5f6a7b8c9d111",
      "assigned_resources": [
        {
          "item_id": "inv_101",
          "qty": 1,
          "name": "Industrial Generator"
        }
      ],
      "workflow_step": "Awaiting_EOC_Approval",
      "priority": "High",
      "comms_channel": "LoRa_Mesh_01",
      "timeline": {
        "created_at": "2026-01-10T14:00:00Z",
        "eoc_approved_at": null,
        "volunteer_accepted_at": null,
        "completed_at": null
      },
      "ai_metadata": {
        "confidence_score": 0.92,
        "match_reasoning": "Volunteer Dave is 2km away and has a 4x4 capable of towing the assigned generator."
      }
    }
  ]
}
```

**Example using cURL:**
```bash
curl http://localhost:3000/api/mission
```

---

### Get Mission by ID
Retrieve a specific mission by its ID.

**Endpoint:** `GET /api/mission/:id`

**Example using cURL:**
```bash
curl http://localhost:3000/api/mission/mission_555
```

---

### Create New Mission
Create a new mission record.

**Endpoint:** `POST /api/mission`

**Request Body:**
```json
{
  "_id": "mission_556",
  "incident_id": "65a1b2c3d4e5f6a7b8c9d0e2",
  "volunteer_id": "65a1b2c3d4e5f6a7b8c9d222",
  "assigned_resources": [
    {
      "item_id": "inv_102",
      "qty": 5,
      "name": "Portable Water Filter"
    }
  ],
  "workflow_step": "Created",
  "priority": "Medium",
  "comms_channel": "Satellite_01",
  "timeline": {
    "created_at": "2026-01-10T15:00:00Z",
    "eoc_approved_at": null,
    "volunteer_accepted_at": null,
    "completed_at": null
  },
  "ai_metadata": {
    "confidence_score": 0.88,
    "match_reasoning": "Volunteer Jane has appropriate equipment for water distribution."
  }
}
```

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/mission \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "mission_556",
    "incident_id": "65a1b2c3d4e5f6a7b8c9d0e2",
    "volunteer_id": "65a1b2c3d4e5f6a7b8c9d222",
    "workflow_step": "Created",
    "priority": "Medium"
  }'
```

---

### Update Mission
Update an existing mission record.

**Endpoint:** `PUT /api/mission/:id`

**Example using cURL:**
```bash
curl -X PUT http://localhost:3000/api/mission/mission_555 \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_step": "In-Progress",
    "timeline": {
      "volunteer_accepted_at": "2026-01-10T16:00:00Z"
    }
  }'
```

---

### Delete Mission
Delete a mission record by ID.

**Endpoint:** `DELETE /api/mission/:id`

**Example using cURL:**
```bash
curl -X DELETE http://localhost:3000/api/mission/mission_555
```

---

## Other Endpoints

### API Information
Get general information about the API.

**Endpoint:** `GET /`

**Response:**
```json
{
  "message": "Disaster Hub API",
  "version": "1.0.0",
  "endpoints": {
    "inventory": "/api/inventory",
    "volunteer": "/api/volunteer",
    "incident": "/api/incident",
    "mission": "/api/mission",
    "health": "/health",
    "hello": "/hello"
  }
}
```

**Example using cURL:**
```bash
curl http://localhost:3000/
```

---

### Health Check
Check the health status of the API and database connection.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

**Example using cURL:**
```bash
curl http://localhost:3000/health
```

---

### List All Endpoints
Get a detailed list of all available API endpoints with descriptions.

**Endpoint:** `GET /hello`

**Response:**
```json
{
  "message": "Hello! Here are the available API endpoints:",
  "endpoints": {
    "inventory": {
      "base": "/api/inventory",
      "methods": {
        "GET /api/inventory": "Get all inventory items",
        "GET /api/inventory/:id": "Get inventory item by ID",
        "POST /api/inventory": "Create new inventory item",
        "PUT /api/inventory/:id": "Update inventory item",
        "DELETE /api/inventory/:id": "Delete inventory item"
      }
    },
    ...
  },
  "timestamp": "2026-01-10T20:12:34.940Z"
}
```

**Example using cURL:**
```bash
curl http://localhost:3000/hello
```

---

## Response Format

### Success Response
All successful operations return a response with `success: true`:

```json
{
  "success": true,
  "data": { ... },
  "count": 0  // Only present for list endpoints
}
```

### Error Response
All errors return a response with `success: false`:

```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## Error Handling

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data (e.g., missing required fields, invalid format)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error occurred (e.g., AI parsing failure, database error)
- `503 Service Unavailable` - Database connection unavailable

### Common Error Scenarios

**Resource Not Found (404):**
```json
{
  "success": false,
  "error": "Inventory item not found"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

**Database Unavailable (503):**
```json
{
  "error": "Database not connected",
  "message": "MongoDB connection is not available"
}
```

**Bad Request (400):**
```json
{
  "success": false,
  "error": "Description is required and must be a non-empty string"
}
```

**AI Parsing Error (500):**
```json
{
  "success": false,
  "error": "Failed to parse incident: [AI error message]"
}
```

---

## Usage Examples

### Using JavaScript (Fetch API)
```javascript
// Get all inventory items
const response = await fetch('http://localhost:3000/api/inventory');
const data = await response.json();
console.log(data);

// Create a new inventory item
const newItem = {
  "_id": "inv_103",
  "item_name": "Emergency Tent",
  "category": "Shelter",
  "total_quantity": 20,
  "available_quantity": 20,
  "allocated_quantity": 0,
  "status": "In-Stock"
};

const createResponse = await fetch('http://localhost:3000/api/inventory', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newItem)
});
const created = await createResponse.json();
console.log(created);
```

### Using Python (requests library)
```python
import requests

# Get all inventory items
response = requests.get('http://localhost:3000/api/inventory')
data = response.json()
print(data)

# Create a new inventory item
new_item = {
    "_id": "inv_103",
    "item_name": "Emergency Tent",
    "category": "Shelter",
    "total_quantity": 20,
    "available_quantity": 20,
    "allocated_quantity": 0,
    "status": "In-Stock"
}

response = requests.post(
    'http://localhost:3000/api/inventory',
    json=new_item
)
print(response.json())
```

---

## Notes

- **ID Format**: All IDs in the examples are strings. The API accepts both string IDs and MongoDB ObjectIds. The API automatically handles conversion between formats.
- **Partial Updates**: When updating resources, you only need to include the fields you want to change.
- **Database**: The API uses MongoDB's `disasterhub` database.
- **Timestamps**: All timestamps are in ISO 8601 format (UTC).
- **Coordinates**: Geographic coordinates follow the GeoJSON format: `[longitude, latitude]`.
- **AI Integration**: The AI-powered incident creation uses Fireworks.ai's DeepSeek v3p1 model. Ensure `FIREWORKS_API_KEY` is set in your environment variables.
- **WebSocket**: WebSocket connections are automatically established when using the frontend. All API operations broadcast updates to connected clients in real-time.
- **Dispatch Feature**: When an incident's `dispatched` field is set to `true`, all connected WebSocket clients receive a reload message to refresh their data.

---

## Support

For issues or questions, please refer to the project repository or contact the development team.
