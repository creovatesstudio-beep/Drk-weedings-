import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function drkEnquiryApiPlugin(): Plugin {
  const queueFile = path.resolve(process.cwd(), 'data', 'website_enquiries_queue.json');

  const ensureQueue = (): Array<Record<string, unknown>> => {
    try {
      const dir = path.dirname(queueFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(queueFile)) {
        fs.writeFileSync(queueFile, '[]', 'utf-8');
        return [];
      }
      return JSON.parse(fs.readFileSync(queueFile, 'utf-8'));
    } catch {
      return [];
    }
  };

  return {
    name: 'drk-website-enquiry-api',
    configureServer(server) {
      server.middlewares.use('/api/public/enquiries', (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-DRK-Webhook-Token');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          const queue = ensureQueue();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, enquiries: queue }));
          return;
        }

        if (req.method === 'DELETE') {
          ensureQueue();
          fs.writeFileSync(queueFile, '[]', 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, cleared: true }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const name = String(payload.name || payload.customer_name || '').trim();
              const phone = String(payload.phone || payload.whatsapp || '').trim();

              if (!name || !phone) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    ok: false,
                    error: 'Both customer name and phone/WhatsApp number are required.',
                  })
                );
                return;
              }

              const entry = {
                id: `web-enq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                customer_name: name,
                phone,
                whatsapp: String(payload.whatsapp || phone).trim(),
                email: String(payload.email || '').trim(),
                event_type: String(payload.event_type || 'Wedding').trim(),
                event_date: String(payload.date || payload.event_date || '').trim(),
                event_location: String(payload.venue || payload.event_location || 'Hazaribagh').trim(),
                estimated_budget: Number(payload.estimated_budget || payload.budget || 185000),
                interested_package_name: String(
                  payload.interested_package_name || payload.package || 'Classic Royal Collection'
                ).trim(),
                event_days: Number(payload.event_days || 3),
                notes: String(payload.message || payload.notes || 'Submitted via public website consultation form.').trim(),
                enquiry_source: 'Website',
                received_at: new Date().toISOString(),
              };

              const queue = ensureQueue();
              queue.push(entry);
              fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2), 'utf-8');

              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  ok: true,
                  message: 'Website enquiry captured by The DRK Weddings CRM.',
                  enquiry: entry,
                })
              );
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  ok: false,
                  error: err instanceof Error ? err.message : 'Invalid JSON payload',
                })
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), drkEnquiryApiPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
