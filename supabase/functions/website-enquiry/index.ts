// ============================================================================
// THE DRK WEDDINGS — SUPABASE EDGE FUNCTION: website-enquiry
// Receives consultation form submissions from https://thedrkweddings.pages.dev/
// Uses server-only SUPABASE_SERVICE_ROLE_KEY to deduplicate, create a Website
// Lead, log a Lead Activity, and trigger an internal CRM Notification.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-drk-webhook-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const expectedToken = Deno.env.get('WEBHOOK_PUBLIC_TOKEN');
    const providedToken = req.headers.get('x-drk-webhook-token');

    if (expectedToken && providedToken !== expectedToken) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid webhook token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();
    const customerName = String(payload.name || payload.customer_name || '').trim();
    const phone = String(payload.phone || payload.whatsapp || '').trim();
    const email = String(payload.email || '').trim();
    const eventDate = String(payload.date || payload.event_date || '').trim() || null;
    const eventLocation = String(payload.venue || payload.event_location || 'Hazaribagh').trim();
    const notes = String(payload.message || payload.notes || '').trim();
    const eventType = String(payload.event_type || 'Wedding').trim();
    const estimatedBudget = Number(payload.estimated_budget || payload.budget || 185000);
    const eventDays = Number(payload.event_days || 3);

    if (!customerName || !phone) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Couple name and phone/WhatsApp number are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);

    // Duplicate check by phone in recent active leads
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, lead_code, customer_name, phone')
      .ilike('phone', `%${normalizedPhone}%`)
      .limit(1);

    if (existingLeads && existingLeads.length > 0) {
      const existing = existingLeads[0];
      await supabase.from('lead_activities').insert({
        lead_id: existing.id,
        activity_type: 'Website Submission',
        summary: 'Follow-up Website Form Submission Received',
        details: `Venue: ${eventLocation} | Date: ${eventDate ?? 'TBD'} | Message: ${notes}`,
        performed_by: 'Website Webhook',
      });

      await supabase.from('notifications').insert({
        type: 'Website Enquiry',
        title: `Updated Website Enquiry: ${existing.customer_name}`,
        message: `${customerName} (${phone}) submitted another inquiry from thedrkweddings.pages.dev.`,
        target_path: '/leads',
        entity_id: existing.id,
      });

      return new Response(
        JSON.stringify({
          ok: true,
          duplicate_merged: true,
          lead_id: existing.id,
          lead_code: existing.lead_code,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const leadCode = `DRK-LD-${Math.floor(1000 + Math.random() * 9000)}`;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const { data: createdLead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        lead_code: leadCode,
        customer_name: customerName,
        phone,
        whatsapp: phone,
        email,
        event_type: eventType,
        event_date: eventDate,
        event_location: eventLocation,
        estimated_budget: estimatedBudget,
        interested_package_name: 'Classic Royal Collection',
        event_days: eventDays,
        enquiry_source: 'Website',
        enquiry_date: new Date().toISOString().split('T')[0],
        follow_up_date: tomorrow,
        status: 'New',
        notes,
      })
      .select()
      .single();

    if (leadErr) throw leadErr;

    await supabase.from('lead_activities').insert({
      lead_id: createdLead.id,
      activity_type: 'Website Submission',
      summary: 'Enquiry captured from thedrkweddings.pages.dev',
      details: `Location: ${eventLocation} | Wedding Date: ${eventDate ?? 'Flexible'} | Notes: ${notes || 'No message'}`,
      performed_by: 'Website Webhook',
    });

    await supabase.from('notifications').insert({
      type: 'Website Enquiry',
      title: `New Website Enquiry: ${customerName}`,
      message: `${customerName} inquired for ${eventType} at ${eventLocation} (${phone}).`,
      target_path: '/leads',
      entity_id: createdLead.id,
    });

    await supabase.from('audit_logs').insert({
      actor_name: 'Public Website Webhook',
      actor_role: 'System',
      action: 'WEBHOOK',
      module: 'leads',
      entity_id: createdLead.id,
      description: `Created lead ${leadCode} (${customerName}) from public website form.`,
      metadata: { phone, email, eventLocation, eventDate },
    });

    return new Response(
      JSON.stringify({ ok: true, duplicate_merged: false, lead: createdLead }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
