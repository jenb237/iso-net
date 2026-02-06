# Iso-Net Indicator (Cinnamon applet)

A small panel applet for Linux Mint Cinnamon that shows whether you're on **Iso-Net** in the expected isolated state:

- **ipv4.gateway:** `--` (no gateway)
- **ipv4.method:** `manual` (no DHCP)

## Visual indicator

- **Offline** (`network-wireless-offline-symbolic`): No network connected.
- **Shield** (`security-high-symbolic`): Iso-Net is active and isolated — no internet (no gateway, manual).
- **Connected** (`network-wireless-connected-symbolic`): Connected to internet — Iso-Net not active or has a gateway.

The applet checks every 5 seconds. Hover for a tooltip with the exact status.

## Installation

1. Copy the applet into Cinnamon’s applets folder:

   ```bash
   cp -r iso-net-indicator@local ~/.local/share/cinnamon/applets/
   ```

2. Reload Cinnamon (Alt+F2 → type `r` → Enter) or log out and back in.

3. Add the applet to the panel:
   - Right-click the panel → **Applets** → find **Iso-Net Indicator** → **Add to panel**.
   - Place it next to the network icon.

## Changing the connection name

The applet checks the connection named **Iso-Net** by default. To use another name, edit `applet.js` and change the line:

```javascript
const CONNECTION_NAME = 'Iso-Net';
```

Then remove and re-add the applet (or restart Cinnamon).

## Check manually (without the applet)

```bash
nmcli connection show Iso-Net
```

Look for:

- `ipv4.gateway: --` (empty = no gateway)
- `ipv4.method: manual` (no DHCP)
