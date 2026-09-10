import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { items, device_id } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse('Items array cannot be empty', 'EMPTY_SYNC_BATCH', 400);
    }

    const admin = createAdminClient();
    const appliedResults: any[] = [];
    const conflictResults: any[] = [];

    for (const item of items) {
      const { entity_type, payload, client_created_at } = item;

      // 1. Record in sync_queue_items table
      const { data: queueRow, error: queueErr } = await (admin.from('sync_queue_items') as any)
        .insert({
          device_id: device_id || 'unknown-device',
          user_id: user.authId,
          entity_type,
          payload,
          client_created_at: client_created_at || new Date().toISOString(),
          status: 'pending',
        })
        .select('*')
        .single();

      if (queueErr || !queueRow) {
        conflictResults.push({ entity_type, error: queueErr?.message });
        continue;
      }

      // 2. Apply entity based on entity_type
      try {
        if (entity_type === 'symptom_report') {
          // Check if animal exists and belongs to user
          const { data: animal } = await (admin.from('animals') as any)
            .select('id, owner_id')
            .eq('id', payload.animal_id)
            .single();

          if (!animal || (user.profile.role === 'farmer' && (animal as any).owner_id !== user.authId)) {
            await (admin.from('sync_queue_items') as any).update({ status: 'conflict' }).eq('id', (queueRow as any).id);
            conflictResults.push({
              id: (queueRow as any).id,
              entity_type,
              reason: 'Animal not found or ownership mismatch',
              strategy: 'LWW_conflict_flagged',
            });
            continue;
          }

          // Apply report
          const { data: rep } = await (admin.from('symptom_reports') as any)
            .insert({
              animal_id: payload.animal_id,
              reported_by: user.authId,
              symptoms: payload.symptoms || [],
              media_urls: payload.media_urls || [],
              gps_lat: payload.gps_lat || 18.52,
              gps_lng: payload.gps_lng || 73.85,
              status: 'pending',
              reported_at: client_created_at || new Date().toISOString(),
            })
            .select('*')
            .single();

          await (admin.from('sync_queue_items') as any)
            .update({ status: 'applied', synced_at: new Date().toISOString() })
            .eq('id', (queueRow as any).id);

          appliedResults.push({ id: (queueRow as any).id, entity_type, applied_record: rep });
        } else if (entity_type === 'health_record') {
          if (!['vet', 'paravet', 'admin'].includes(user.profile.role)) {
            await (admin.from('sync_queue_items') as any).update({ status: 'conflict' }).eq('id', (queueRow as any).id);
            conflictResults.push({ id: (queueRow as any).id, entity_type, reason: 'Unauthorized role' });
            continue;
          }

          const { data: rec } = await (admin.from('health_records') as any)
            .insert({
              animal_id: payload.animal_id,
              record_type: payload.record_type,
              description: payload.description,
              performed_by: user.authId,
              performed_at: payload.performed_at || client_created_at || new Date().toISOString(),
              next_due_at: payload.next_due_at || null,
            })
            .select('*')
            .single();

          await (admin.from('sync_queue_items') as any)
            .update({ status: 'applied', synced_at: new Date().toISOString() })
            .eq('id', (queueRow as any).id);

          appliedResults.push({ id: (queueRow as any).id, entity_type, applied_record: rec });
        } else {
          // Unknown entity
          await (admin.from('sync_queue_items') as any).update({ status: 'conflict' }).eq('id', (queueRow as any).id);
          conflictResults.push({ id: (queueRow as any).id, entity_type, reason: 'Unsupported entity_type' });
        }
      } catch (applyErr: any) {
        await (admin.from('sync_queue_items') as any).update({ status: 'conflict' }).eq('id', (queueRow as any).id);
        conflictResults.push({ id: (queueRow as any).id, entity_type, reason: applyErr.message });
      }
    }

    return successResponse({
      applied_count: appliedResults.length,
      conflict_count: conflictResults.length,
      applied: appliedResults,
      conflicts: conflictResults,
      conflict_strategy: 'Last-Write-Wins with explicit conflict flagging (not CRDT)',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync push failed';
    return errorResponse(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}

