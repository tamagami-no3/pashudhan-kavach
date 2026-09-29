/**
 * Integration Test for Farmer-Centric High-Adoption Engine:
 * 1. Triage & SLA Ticket Dispatch API (POST & GET)
 * 2. WhatsApp Webhook Ingestion API (GET verification & POST inbound message)
 * 3. Village Outbreak Advisory Broadcast Cron
 */

import { POST as triagePost, GET as triageGet } from '../app/api/symptoms/triage-report/route';
import { GET as waGet, POST as waPost } from '../app/api/webhooks/whatsapp/route';
import { GET as cronGet } from '../app/api/cron/village-alerts/route';
import { NextRequest } from 'next/server';

async function runTests() {
  console.log('🧪 Starting Farmer-Centric Engine Integration Tests...\n');

  // Test 1: Triage API - FMD Case
  console.log('▶ TEST 1: POST /api/symptoms/triage-report (FMD Case)');
  const triageReq = new NextRequest('http://localhost:3000/api/symptoms/triage-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_uid: '999900001111',
      symptoms: ['drooling', 'mouth_blisters', 'lameness'],
      language: 'mr',
      latitude: 18.5204,
      longitude: 73.8567,
    }),
  });
  const triageRes = await triagePost(triageReq);
  const triageJson = await triageRes.json();
  console.log('Status:', triageRes.status);
  console.log('Success:', triageJson.success);
  console.log('Ticket ID:', triageJson.data?.ticket_id);
  console.log('Risk Level:', triageJson.data?.triage?.riskLevel);
  console.log('SLA Minutes:', triageJson.data?.sla_minutes);
  console.log('Assigned Vet:', triageJson.data?.assigned_vet?.name);
  if (!triageJson.success || !triageJson.data?.ticket_id?.startsWith('PK-')) {
    throw new Error('Test 1 Failed: Expected valid PK- ticket ID');
  }
  console.log('✅ Test 1 Passed!\n');

  // Test 2: GET /api/symptoms/triage-report by ticket_id
  console.log('▶ TEST 2: GET /api/symptoms/triage-report?ticket_id=' + triageJson.data.ticket_id);
  const getReq = new NextRequest(`http://localhost:3000/api/symptoms/triage-report?ticket_id=${triageJson.data.ticket_id}`);
  const getRes = await triageGet(getReq);
  const getJson = await getRes.json();
  console.log('Status:', getRes.status);
  console.log('Retrieved Ticket:', getJson.data?.ticket_id);
  console.log('Dispensary:', getJson.data?.dispensary?.name);
  if (!getJson.success || getJson.data?.ticket_id !== triageJson.data.ticket_id) {
    throw new Error('Test 2 Failed: Could not retrieve saved ticket');
  }
  console.log('✅ Test 2 Passed!\n');

  // Test 3: WhatsApp Webhook GET Verification Handshake
  console.log('▶ TEST 3: GET /api/webhooks/whatsapp (Verification Handshake)');
  const verifyReq = new NextRequest(
    'http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=pashudhan_kavach_secret&hub.challenge=test_challenge_12345'
  );
  const verifyRes = await waGet(verifyReq);
  const verifyText = await verifyRes.text();
  console.log('Verification Status:', verifyRes.status);
  console.log('Verification Response Body:', verifyText);
  if (verifyRes.status !== 200 || verifyText !== 'test_challenge_12345') {
    throw new Error('Test 3 Failed: Webhook verification challenge mismatch');
  }
  console.log('✅ Test 3 Passed!\n');

  // Test 4: WhatsApp Inbound Message POST
  console.log('▶ TEST 4: POST /api/webhooks/whatsapp (Inbound Farmer Message)');
  const waInboundReq = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUS_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                messages: [
                  {
                    from: '919876543210',
                    id: 'wamid.HBgLOTE5ODc2NTQzMjEwFQIAEhgg...',
                    timestamp: '1726675000',
                    type: 'text',
                    text: {
                      body: 'गाय खूप आजारी आहे तोंडात फोड आले आहेत आणि लाळ गळत आहे',
                    },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    }),
  });
  const waRes = await waPost(waInboundReq);
  const waJson = await waRes.json();
  console.log('WhatsApp POST Status:', waRes.status);
  console.log('Ticket ID:', waJson.ticket_id);
  console.log('Auto-Reply Text Sample:\n', waJson.auto_reply);
  if (!waJson.success || !waJson.ticket_id?.startsWith('PK-') || !waJson.auto_reply?.includes('1962')) {
    throw new Error('Test 4 Failed: Expected WhatsApp ticket auto-reply with PK- ticket and 1962 helpline');
  }
  console.log('✅ Test 4 Passed!\n');

  // Test 5: Village Outbreak Alert Cron
  console.log('▶ TEST 5: GET /api/cron/village-alerts (Cron Job)');
  const cronReq = new NextRequest('http://localhost:3000/api/cron/village-alerts', {
    headers: {
      Authorization: 'Bearer pashudhan_cron_secret_2026',
    },
  });
  const cronRes = await cronGet(cronReq);
  const cronJson = await cronRes.json();
  console.log('Cron Status:', cronRes.status);
  console.log('Alerts Generated:', cronJson.alerts_generated);
  console.log('Total Districts Evaluated:', cronJson.total_districts_evaluated);
  if (!cronJson.success) {
    throw new Error('Test 5 Failed: Village alerts cron error');
  }
  console.log('✅ Test 5 Passed!\n');

  console.log('🎉 ALL 5 INTEGRATION TESTS PASSED PERFECTLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
