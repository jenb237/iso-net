// iso-net-indicator@local/applet.js by jenb 2026
// MIT License
// Setup notes:
// 1. Create a wired or Wi-Fi connection profile called 'Iso-Net'
//    (or change CONNECTION_NAME below to match your profile name).
// 2. In the IPv4 settings for that profile, set the method to "Manual"
//    and give it a static IP address on your isolated network.
// 3. Leave the IPv4 gateway field empty so the profile has no default route.
// When this profile is active with a manual IP and no gateway, this applet
// will show the airplane (isolated) icon instead of the normal internet icon.

const Applet = imports.ui.applet;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

// ICONS - Cinnamon icons
const ICON_OFFLINE = 'dialog-password-symbolic';
const ICON_ISOLATED = 'airplane-mode-symbolic';
const ICON_CONNECTED = 'network-workgroup-symbolic';

// CHANGE THIS TO THE NAME OF YOUR Iso-Net CONNECTION
const CONNECTION_NAME = 'Iso-Net';

// Only ethernet and wifi count as "real" connections (ignore bridge, loopback, vpn, docker, etc.)
const REAL_CONNECTION_TYPES = ['802-3-ethernet', '802-11-wireless', 'ethernet', 'wifi'];

function byteArrayToString(byteArray) {
    if (!byteArray || byteArray.length === 0) return '';
    if (typeof byteArray === 'string') return byteArray;
    return String.fromCharCode.apply(null, byteArray);
}

function checkConnectionState() {
    try {
        // 1. Check connectivity first — "none" = not connected to any network
        let [okConn, stdoutConn, , exitConn] = GLib.spawn_command_line_sync(
            'nmcli -t networking connectivity 2>/dev/null'
        );
        if (okConn && exitConn === 0) {
            let connectivity = byteArrayToString(stdoutConn).trim().toLowerCase();
            if (connectivity === 'none') {
                return { state: 'offline', reason: 'No network connected' };
            }
        }

        // 2. Get active connection(s) with TYPE — only ethernet/wifi count (not bridge, loopback, vpn, docker, etc.)
        let [okActive, stdoutActive, , exitActive] = GLib.spawn_command_line_sync(
            'nmcli -t -f NAME,TYPE con show --active'
        );
        if (!okActive || exitActive !== 0) {
            return { state: 'offline', reason: 'Could not get active connection' };
        }
        let activeNames = [];
        byteArrayToString(stdoutActive).split('\n').forEach(function (line) {
            let parts = line.split(':');
            if (parts.length >= 2) {
                let name = parts[0].trim();
                let type = (parts[1] || '').trim().toLowerCase();
                if (name.length > 0 && REAL_CONNECTION_TYPES.indexOf(type) >= 0) {
                    activeNames.push(name);
                }
            }
        });

        if (activeNames.length === 0) {
            return { state: 'offline', reason: 'No network connected' };
        }

        let isoNetActive = activeNames.indexOf(CONNECTION_NAME) >= 0;

        if (!isoNetActive) {
            return { state: 'internet', reason: 'Connected: ' + activeNames.join(', ') };
        }

        // 3. Iso-Net is active — check profile: no gateway, manual
        let [ok, stdout, stderr, exitStatus] = GLib.spawn_command_line_sync(
            'nmcli connection show "' + CONNECTION_NAME + '"'
        );
        if (!ok || exitStatus !== 0) {
            return { state: 'internet', reason: 'Iso-Net profile not found or nmcli failed' };
        }

        let out = byteArrayToString(stdout);
        let gateway = '';
        let method = '';

        out.split('\n').forEach(function (line) {
            let m = line.match(/^\s*ipv4\.gateway\s*:\s*(.*)$/);
            if (m) gateway = (m[1] || '').trim();
            m = line.match(/^\s*ipv4\.method\s*:\s*(.*)$/);
            if (m) method = (m[1] || '').trim();
        });

        let noGateway = !gateway || gateway === '--' || gateway === '';
        let isManual = method === 'manual';

        if (noGateway && isManual) {
            return { state: 'isolated', reason: 'Iso-Net: isolated (no internet, no gateway)' };
        }
        if (!noGateway) {
            return { state: 'internet', reason: 'Iso-Net has gateway: ' + gateway };
        }
        return { state: 'internet', reason: 'Iso-Net method: ' + method + ' (expected manual)' };
    } catch (e) {
        return { state: 'offline', reason: 'Error: ' + e.message };
    }
}

function MyApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function (orientation, panel_height, instance_id) {
        Applet.IconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
        this._networkMonitor = Gio.NetworkMonitor.get_default();
        this._networkChangedId = this._networkMonitor.connect(
            'network-changed',
            (monitor, available) => {
                this._update();
            }
        );
        this._update();
    },

    _update: function () {
        let result = checkConnectionState();

        if (result.state === 'offline') {
            this.set_applet_icon_name(ICON_OFFLINE);
            this.set_applet_tooltip(_(result.reason));
        } else if (result.state === 'isolated') {
            this.set_applet_icon_name(ICON_ISOLATED);
            this.set_applet_tooltip(_(result.reason));
        } else {
            this.set_applet_icon_name(ICON_CONNECTED);
            this.set_applet_tooltip(_(result.reason));
        }
    },

    on_applet_removed_from_panel: function () {
        if (this._networkMonitor && this._networkChangedId) {
            this._networkMonitor.disconnect(this._networkChangedId);
            this._networkChangedId = 0;
        }
        this._networkMonitor = null;
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}
