'use strict';

const webpush = require('web-push');

const NOTIFICATION_TYPES = new Set(['important', 'message', 'reminder', 'system', 'marketing']);

function configured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

if (configured()) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

function preferenceColumn(type) {
  return {
    important: 'push_important',
    message: 'push_messages',
    reminder: 'push_reminders',
    system: 'push_system',
    marketing: 'push_marketing',
  }[type] || 'push_system';
}

function safePayload(input) {
  const type = NOTIFICATION_TYPES.has(input.type) ? input.type : 'system';
  const deepLink = typeof input.deepLink === 'string' && input.deepLink.startsWith('/')
    ? input.deepLink.slice(0, 300)
    : '/workspace.html';
  return {
    title: String(input.title || 'EdgeKeeper').slice(0, 80),
    body: String(input.body || '').slice(0, 240),
    icon: '/assets/app-icon-192.svg',
    badge: '/assets/app-icon-192.svg',
    type,
    entityId: input.entityId ? String(input.entityId).slice(0, 120) : null,
    url: deepLink,
    timestamp: new Date().toISOString(),
  };
}

async function sendToUser(supabaseAdmin, userId, input) {
  if (!configured()) return { skipped: true, reason: 'push_not_configured' };
  const payload = safePayload(input);
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('push_notifications, ' + preferenceColumn(payload.type))
    .eq('id', userId)
    .maybeSingle();
  if (!profile?.push_notifications || profile[preferenceColumn(payload.type)] === false) {
    return { skipped: true, reason: 'preference_disabled' };
  }

  const { data: subscriptions, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, subscription')
    .eq('user_id', userId);
  if (error || !subscriptions?.length) return { skipped: true, reason: 'no_subscriptions' };

  let delivered = 0;
  let failed = 0;
  for (const row of subscriptions) {
    try {
      await webpush.sendNotification(row.subscription, JSON.stringify(payload));
      delivered++;
      await supabaseAdmin.from('push_subscriptions').update({ last_seen_at: new Date().toISOString() }).eq('id', row.id);
    } catch (err) {
      failed++;
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabaseAdmin.from('push_subscriptions').delete().eq('id', row.id);
      }
    }
  }

  await supabaseAdmin.from('push_notification_log').insert({
    user_id: userId,
    notification_type: payload.type,
    entity_id: payload.entityId,
    deep_link: payload.url,
    title: payload.title,
    body: payload.body,
    delivered_count: delivered,
    failed_count: failed,
  });
  return { delivered, failed };
}

module.exports = { configured, safePayload, sendToUser };
