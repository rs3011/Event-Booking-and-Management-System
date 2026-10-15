/**
 * EventViser Uptime Heartbeat & Anti-Cold-Start Utility
 * Pings the backend health endpoint periodically to prevent free-tier hosting (like Render)
 * from spinning down after 15 minutes of inactivity, and monitors API health.
 *
 * Usage:
 *   node server/scripts/uptimeHeartbeat.js [--once] [--interval=10]
 *   or:
 *   TARGET_URL=https://event-booking-and-management-system-b02g.onrender.com/api/health node server/scripts/uptimeHeartbeat.js
 */

const https = require('https');
const http = require('http');

const targetUrl = process.env.TARGET_URL || 'https://event-booking-and-management-system-b02g.onrender.com/api/health';
const isOnce = process.argv.includes('--once');
const intervalArg = process.argv.find((arg) => arg.startsWith('--interval='));
const intervalMinutes = intervalArg ? parseInt(intervalArg.split('=')[1], 10) : 10;
const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

console.log(`[UptimeHeartbeat] Configured for target: ${targetUrl}`);
console.log(`[UptimeHeartbeat] Mode: ${isOnce ? 'Single-check' : `Recurring every ${intervalMinutes}m`}`);

const pingHealth = () => {
  const startTime = Date.now();
  const urlObj = new URL(targetUrl);
  const client = urlObj.protocol === 'https:' ? https : http;

  const req = client.get(
    targetUrl,
    {
      headers: {
        'User-Agent': 'EventViser-UptimeHeartbeat/1.0',
        Accept: 'application/json',
      },
      timeout: 60000,
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        const timestamp = new Date().toISOString();

        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            const dbStatus = json?.database?.status || 'unknown';
            console.log(`[${timestamp}] ✅ HEALTHY (${res.statusCode}) - ${duration}ms | DB: ${dbStatus} | Uptime: ${json?.uptime || 0}s`);
          } catch {
            console.log(`[${timestamp}] ✅ OK (${res.statusCode}) - ${duration}ms`);
          }
        } else {
          console.warn(`[${timestamp}] ⚠️ UNHEALTHY STATUS (${res.statusCode}) - ${duration}ms`);
        }
      });
    }
  );

  req.on('timeout', () => {
    req.destroy();
    console.error(`[${new Date().toISOString()}] ❌ Request timed out after 15s`);
  });

  req.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] ❌ Ping failed:`, err.message);
  });
};

// Immediate ping
pingHealth();

if (!isOnce) {
  setInterval(pingHealth, intervalMs);
}
