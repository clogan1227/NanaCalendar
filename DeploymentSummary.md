# Nana Calendar Raspberry Pi Deployment Summary

## Overview
This document describes how I deployed the **Nana Calendar** React application to a Raspberry Pi. The goal was to run the app locally in full-screen kiosk mode using Chromium and ensure it starts automatically on boot.

## Raspberry Pi Setup
I started with a Raspberry Pi running Raspberry Pi OS and connected it to my local network. I confirmed its IP address using `hostname -I` so I could SSH into it from my development machine.

After connecting via SSH, I installed all required software:

```bash
sudo apt update
sudo apt install -y nodejs npm chromium-browser unclutter
sudo npm install -g pm2 serve
```

These packages enable serving the React build locally (`serve`), managing processes (`pm2`), running Chromium in kiosk mode, and hiding the mouse cursor (`unclutter`).

## Transferring the Build Folder
On my main computer, I generated a React production build using:

```bash
npm run build
```

I transferred the resulting folder to the Pi using SCP:

```bash
scp -r build/ pi@<PI_IP_ADDRESS>:/home/pi/
```

This placed the build files in the Pi's home directory.

## Kiosk and Server Scripts
Two scripts manage the app display and server processes.

### launch-kiosk.sh
This script starts Chromium in kiosk mode and points it to the locally hosted app.

```bash
#!/bin/bash

# Set environment variable for display
export DISPLAY=:0

# Auth token for kiosk mode
KIOSK_TOKEN=""

# Local URL for kiosk display
URL="http://localhost:3000/?kiosk_token=$KIOSK_TOKEN"

# Hide cursor after one second of inactivity
unclutter -idle 1 -root &

# Allow desktop to load
sleep 5

# Prevent Chromium "restore session" popup
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences

# Launch in kiosk mode
/usr/bin/chromium-browser --noerrdialogs --disable-infobars --kiosk "$URL" --enable-logging=stderr --v=1
```

I made it executable:

```bash
chmod +x launch-kiosk.sh
```

### start-server.sh
This script runs the static server for the React build:

```bash
/usr/local/bin/serve -s /home/cloga/build --listen 3000
```

I made it executable:

```bash
chmod +x start-server.sh
```

## Process Management with PM2
I used PM2 to manage and restart both processes automatically. I started each process manually first to confirm correct behavior:

```bash
pm2 start /usr/local/bin/serve --name "calendar-server" -- -s /home/cloga/build --listen 3000
pm2 start ./launch-kiosk.sh --name "calendar-kiosk"
```

Once verified, I set up PM2 to start at boot and saved the process list:

```bash
pm2 startup
# Run the command PM2 outputs after executing the above
pm2 save
```

This ensures both the kiosk and the local server start on system boot.

## Updating the Deployment
When updating the app build, I use this process:

1. On my development computer:
   - Run `npm run build` to create a new production build.
2. On the Raspberry Pi (via SSH):
   ```bash
   pm2 stop all
   rm -rf build
   ```
3. On my development computer:
   ```bash
   scp -r build/ pi@<PI_IP_ADDRESS>:/home/pi/
   ```
4. Back on the Pi:
   ```bash
   pm2 start all
   ```

This replaces the old build with the new one and restarts the processes.

## Summary
The Nana Calendar app runs locally on the Raspberry Pi using Chromium in kiosk mode. The React build is served through `serve`, and PM2 handles process management and autostart. Updating the deployment requires rebuilding the project, replacing the `build` folder, and restarting PM2 processes.
