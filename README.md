# Iso-Net Indicator (Cinnamon applet)

A small panel applet for Linux Mint Cinnamon that shows whether your special **Iso-Net** connection is:

- **Offline** (no active ethernet/wifi) <img width="64" height="28" alt="image" src="https://github.com/user-attachments/assets/48e17acd-4854-43d7-9802-baf3b3c16c54" />

- **Isolated** on Iso-Net (local network only, no gateway / no internet) <img width="64" height="44" alt="image" src="https://github.com/user-attachments/assets/2c99cd2b-a1c6-4319-9ece-8106e109a6d7" />

- **Online** (normal internet connectivity) <img width="66" height="48" alt="image" src="https://github.com/user-attachments/assets/0b916aa6-54dc-4874-a1b8-c7181e430528" />


It listens to system network changes (via `Gio.NetworkMonitor`) and then uses `nmcli` to inspect connections, so it only runs when connectivity actually changes.

---

## How it decides the state

1. **Check overall connectivity**
   - If `nmcli -t networking connectivity` reports `none`, the applet shows **Offline**.

2. **Look at active connections**
   - `nmcli -t -f NAME,TYPE con show --active`
   - Only **ethernet** / **wifi** types count (no bridges, VPN, docker, etc.).
   - If there are no active ethernet/wifi connections → **Offline**.

3. **Check the Iso-Net profile**
   - The profile name defaults to `Iso-Net` (see below to change it).
   - If Iso-Net is **not** in the list of active connections:
     - Show **Online** with a tooltip listing the active connection names.
   - If Iso-Net **is** active:
     - `nmcli connection show "Iso-Net"` is parsed for:
       - `ipv4.gateway` (must be empty / `--`)
       - `ipv4.method` (must be `manual`)
     - If **no gateway** and **manual** → **Isolated** (local only, no default route).
     - Otherwise → **Online** (Iso-Net has a gateway or unexpected method).

Tooltips always show the exact reason (e.g. “Iso-Net: isolated (no internet, no gateway)” or “Connected: HomeWifi”).

---

## Setting up the Iso-Net connection

1. **Create a connection profile**
   - In Network Manager (or the Mint network settings), create a wired or Wi‑Fi profile named **Iso-Net**.
   - Or choose any name you like and update `CONNECTION_NAME` in `applet.js`.

2. **IPv4 settings**
   - Method: **Manual**
   - Set a static IP address on your isolated network.
   - Leave **Gateway** empty so there is **no default route / no internet**.
  
<img width="789" height="551" alt="image" src="https://github.com/user-attachments/assets/716f6bf8-7f4d-4908-b4b4-e74680e659a4" />


3. **Test it manually**

   ```bash
   nmcli connection show Iso-Net
   ```

   You should see:

   - `ipv4.gateway: --`
   - `ipv4.method: manual`

When this profile is active with those settings, the applet will show the **isolated** icon instead of normal internet.

---

## Installation

1. Copy the applet into Cinnamon’s applets folder:

   ```bash
   cp -r iso-net-indicator@local ~/.local/share/cinnamon/applets/
   ```

2. Reload Cinnamon (for example: `Ctrl` + `Alt` + `Escape`, or `Alt` + `F2` → `r` → Enter).

3. Add the applet to the panel:
   - Right-click the panel → **Applets**
   - Find **Iso-Net Indicator**
   - Click **Add to panel**

---

## Changing the connection name

In `applet.js`:

```javascript
const CONNECTION_NAME = 'Iso-Net';
```

Change `'Iso-Net'` to match your profile’s name, then reload Cinnamon or remove/re-add the applet.
