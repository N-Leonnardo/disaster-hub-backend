# Disaster Hub Frontend

A real-time map interface for the Disaster Hub backend, featuring Google Maps integration and WebSocket support for live updates.

## Features

- 🗺️ **Google Maps Integration** - Interactive map displaying incidents, volunteers, and missions
- 🔄 **Real-time Updates** - WebSocket connection for live data synchronization
- 📊 **Statistics Dashboard** - Real-time counts of incidents, volunteers, and missions
- 📝 **Activity Log** - Live feed of all map updates
- 🎨 **Modern UI** - Clean, responsive design with sidebar controls

## Setup

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Maps JavaScript API
4. Create credentials (API Key)
5. (Optional) Restrict the API key to your domain for security

### 2. Configure API Key

Open `index.html` and replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap" async defer></script>
```

### 3. Install Backend Dependencies

Make sure you've installed the backend dependencies:

```bash
cd ../disaster-hub-backend
npm install
```

This will install:
- `ws` - WebSocket server
- `cors` - CORS middleware

### 4. Start the Backend Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

The server will run on `http://localhost:3000` by default.

### 5. Access the Frontend

Open your browser and navigate to:
```
http://localhost:3000
```

The frontend is served as static files from the `disasterhubfe` directory.

## Data Structure

The frontend expects data with location information in the following format:

### Incident
```json
{
  "_id": "incident_id",
  "name": "Incident Name",
  "type": "Fire",
  "status": "Active",
  "description": "Description",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

### Volunteer
```json
{
  "_id": "volunteer_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "skills": "Medical, First Aid",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

### Mission
```json
{
  "_id": "mission_id",
  "name": "Mission Name",
  "status": "In Progress",
  "priority": "High",
  "description": "Description",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

## WebSocket Events

The frontend listens for the following WebSocket events:

- `incident_created` - New incident added
- `incident_updated` - Incident updated
- `incident_deleted` - Incident removed
- `volunteer_created` - New volunteer added
- `volunteer_updated` - Volunteer updated
- `volunteer_deleted` - Volunteer removed
- `mission_created` - New mission added
- `mission_updated` - Mission updated
- `mission_deleted` - Mission removed

## Map Markers

- 🔴 **Red markers** - Incidents
- 🔵 **Blue markers** - Volunteers
- 🟢 **Green markers** - Missions

Click on any marker to see detailed information in an info window.

## Troubleshooting

### Map not loading
- Check that your Google Maps API key is correctly set
- Verify the API key has the Maps JavaScript API enabled
- Check browser console for errors

### WebSocket not connecting
- Ensure the backend server is running
- Check that the WebSocket server is accessible at `ws://localhost:3000/ws`
- Verify CORS is properly configured in the backend

### Markers not appearing
- Ensure your data includes `location.lat` and `location.lng` fields
- Check the browser console for JavaScript errors
- Verify the API endpoints are returning data correctly

## Development

The frontend is a single-page HTML application with embedded JavaScript. To modify:

1. Edit `index.html` directly
2. Refresh the browser to see changes
3. Use browser developer tools for debugging

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

Requires modern browser with WebSocket and ES6+ support.
