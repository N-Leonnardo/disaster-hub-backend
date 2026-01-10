# Sharing the Disaster Hub on Your Local Network

## Quick Setup

### 1. Find Your IP Address

**On macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```bash
ipconfig
```

Look for your local network IP (usually starts with `10.x.x.x`, `192.168.x.x`, or `172.16.x.x`)

### 2. Start the Server

Make sure the server is running:
```bash
npm start
# or
npm run dev
```

The server will be accessible on:
- **Your computer:** `http://localhost:3000`
- **Other devices on same network:** `http://YOUR_IP:3000`

For example, if your IP is `10.1.63.11`:
- **Share this URL:** `http://10.1.63.11:3000`

### 3. Firewall Configuration

Make sure port 3000 is open in your firewall:

**macOS:**
- System Settings → Network → Firewall → Firewall Options
- Allow incoming connections for Node.js

**Windows:**
- Windows Defender Firewall → Allow an app
- Add Node.js or allow port 3000

**Linux:**
```bash
sudo ufw allow 3000
```

### 4. Share the URL

Share this URL with friends on the same network:
```
http://10.1.63.11:3000
```

Replace `10.1.63.11` with your actual IP address.

## Troubleshooting

### Friends can't access the app

1. **Check server is running:**
   ```bash
   # Should see: "Server is running on port 3000"
   ```

2. **Verify IP address:**
   - Make sure you're using the correct IP
   - Both devices must be on the same network (same WiFi/router)

3. **Check firewall:**
   - Port 3000 must be open
   - Try temporarily disabling firewall to test

4. **Test from your computer:**
   ```bash
   curl http://10.1.63.11:3000/health
   ```
   Should return JSON with status

### WebSocket connection fails

- Make sure both devices are on the same network
- Check that port 3000 is accessible
- Verify the server logs show WebSocket connections

### Using a Different Port

If you want to use port 80 (so friends don't need to type `:3000`):

**Option 1: Change the port in .env or environment:**
```bash
PORT=80 npm start
```

**Option 2: Use a reverse proxy (nginx, etc.)**

## Frontend Configuration

The frontend automatically detects how it's being accessed and configures API/WebSocket connections accordingly:

- **If accessed via `http://10.1.63.11:3000`** → API connects to `http://10.1.63.11:3000`
- **If accessed via `http://10.1.63.11` (port 80)** → API connects to `http://10.1.63.11:3000`
- **If accessed via `http://localhost:3000`** → API connects to `http://localhost:3000`

The frontend will log its configuration in the browser console. Open Developer Tools (F12) to see:
```
🌐 Frontend Configuration:
   Current URL: http://10.1.63.11:3000/
   Hostname: 10.1.63.11
   API Base URL: http://10.1.63.11:3000
   WebSocket URL: ws://10.1.63.11:3000/ws
```

## Network Access Verification

The server now binds to `0.0.0.0`, which means it's accessible from:
- ✅ Localhost (127.0.0.1)
- ✅ Your local network IP (10.1.63.11, etc.)
- ✅ All network interfaces

You should see in the server logs:
```
[Server] Network access: http://0.0.0.0:3000 (accessible from your local network)
```

## Frontend Troubleshooting

### Check Browser Console

Open Developer Tools (F12) and check the Console tab for:
- Frontend configuration logs
- API connection errors
- WebSocket connection status

### Common Issues

**"Failed to fetch" errors:**
- Server might not be running
- Firewall blocking port 3000
- Wrong IP address

**WebSocket connection fails:**
- Check that WebSocket URL matches your network IP
- Verify port 3000 is accessible
- Check browser console for specific error messages
