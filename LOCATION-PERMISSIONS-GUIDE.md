# How to Enable Location Permissions

If you see the error "Permission denied. Please enable location access", follow these steps for your browser:

## Chrome / Chromium / Edge

1. **Look for the lock icon** 🔒 or **location icon** 📍 in the address bar (left side)
2. Click on it to open **Site settings**
3. Find **"Location"** in the permissions list
4. Change it from **"Block"** to **"Allow"**
5. **Refresh the page** and click the location button again

**Alternative method:**
- Go to `chrome://settings/content/location` (or `edge://settings/content/location`)
- Find this website in the list
- Change permission to "Allow"

## Firefox

1. **Look for the lock icon** 🔒 or **shield icon** 🛡️ in the address bar
2. Click on it and select **"More Information"**
3. Go to the **"Permissions"** tab
4. Find **"Access your location"**
5. Change it from **"Block"** to **"Allow"**
6. **Refresh the page** and try again

**Alternative method:**
- Go to `about:preferences#privacy`
- Scroll to "Permissions" section
- Click "Settings" next to "Location"
- Find this website and change to "Allow"

## Safari (macOS)

1. Go to **Safari → Settings** (or **Preferences**)
2. Click the **"Websites"** tab
3. Select **"Location Services"** from the left sidebar
4. Find this website in the list
5. Change it from **"Deny"** to **"Allow"**

**Quick method:**
- Click the **location icon** 📍 in the address bar
- Select **"Allow"** from the dropdown
- Refresh the page

## Mobile Browsers

### iOS Safari
1. Go to **Settings → Safari → Location Services**
2. Make sure location services are enabled
3. When prompted in the browser, tap **"Allow"**

### Android Chrome
1. When prompted, tap **"Allow"**
2. If you previously denied, go to **Settings → Site Settings → Location**
3. Find this website and change to "Allow"

## Troubleshooting

### Still not working?

1. **Check system location services:**
   - **macOS:** System Settings → Privacy & Security → Location Services
   - **Windows:** Settings → Privacy → Location
   - **Linux:** Check your desktop environment's location settings

2. **Try a different browser** to see if it's browser-specific

3. **Check if you're using HTTPS:**
   - Some browsers require HTTPS for location access
   - If using HTTP, try accessing via `http://localhost:3000` or your local IP

4. **Clear browser cache and cookies** for this site

5. **Restart your browser** after changing permissions

### Browser-specific notes:

- **Chrome:** May require HTTPS for location on some systems
- **Firefox:** More permissive with HTTP/localhost
- **Safari:** Requires explicit permission for each site
- **Edge:** Similar to Chrome

## Why location access is needed

The Disaster Hub map needs your location to:
- Show where you are on the map
- Center the map on your location
- Help coordinate with nearby volunteers and incidents
- Provide context for disaster response efforts

Your location data is **only used locally** in your browser and is **not sent to any server** unless you explicitly share it.
