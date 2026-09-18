import { NextRequest, NextResponse } from 'next/server';
import { runDiseaseTriage } from '@/lib/services/triageEngine';
import { matchSymptomsFromText } from '@/lib/constants/symptoms';
import { saveSymptomReport } from '@/lib/persistent-store';

export const dynamic = 'force-dynamic';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'pashudhan_kavach_secret';

/**
 * WhatsApp Cloud API Webhook Subscription Verification (Handshake)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WhatsApp Webhook verified successfully');
    return new Response(challenge || '', { status: 200 });
  }

  return new Response('Verification token mismatch', { status: 403 });
}

/**
 * WhatsApp Inbound Event Webhook (Receives farmer text/audio messages)
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // 1. Extract message details from WhatsApp Cloud API schema or simulated direct payload
    let senderPhone = '919822000000';
    let messageText = '';
    let hasAudio = false;

    if (payload.entry && payload.entry[0]?.changes && payload.entry[0]?.changes[0]?.value) {
      const value = payload.entry[0].changes[0].value;
      const message = value.messages?.[0];
      if (message) {
        senderPhone = message.from;
        if (message.type === 'text') {
          messageText = message.text?.body || '';
        } else if (message.type === 'audio' || message.type === 'voice') {
          hasAudio = true;
          messageText = 'गाईला खूप ताप आला आहे आणि लाळ गळत आहे'; // Simulated transcription fallback
        }
      }
    } else {
      // Direct integration or testing payload
      senderPhone = payload.from || payload.phone || senderPhone;
      messageText = payload.text || payload.message || '';
      hasAudio = Boolean(payload.audio_url);
    }

    // 2. Extract clinical symptoms from message text
    const matched = matchSymptomsFromText(messageText);
    const symptomIds = matched.map((s) => s.id);
    if (symptomIds.length === 0) {
      symptomIds.push('fever_high'); // default fallback
    }

    // 3. Run triage engine
    const triage = runDiseaseTriage(symptomIds);
    const ticketId = `PK-${Math.floor(100000 + Math.random() * 900000)}`;

    // 4. Persist to storage
    saveSymptomReport({
      animal_id: 'anim-default-1',
      reported_by: senderPhone,
      symptoms: symptomIds,
      media_urls: hasAudio ? ['whatsapp-voice-note'] : [],
      gps_lat: 18.5204,
      gps_lng: 73.8567,
      status: 'triaged',
    });

    // 5. Construct regional auto-response text
    const autoReplyText = `🙏 *पशुधन कवच (महाराष्ट्र शासन)*
आपली तक्रार यशस्वीरीत्या नोंदवली गेली आहे!

📋 *तक्रार तिकीट:* ${ticketId}
🔍 *प्राथमिक निदान:* ${triage.predictedDisease}
⚠️ *धोका पातळी:* ${triage.riskLevel.toUpperCase()}
⏳ *पशुवैद्यक संपर्क कालावधी:* ${triage.riskLevel === 'critical' ? '३० मिनिटे' : '६० मिनिटे'}

🛡️ *तातडीचा सल्ला:*
१. आजारी जनावरास इतर जनावरांपासून वेगळे बांधा.
२. पोटॅशियम परमँगनेटच्या पाण्याने गोठा स्वच्छ करा.
३. आपत्कालीन मदतीसाठी टोल-फ्री *1962* वर संपर्क साधा.`;

    return NextResponse.json({
      success: true,
      ticket_id: ticketId,
      sender: senderPhone,
      triage: {
        disease: triage.predictedDisease,
        risk_level: triage.riskLevel,
        confidence: triage.confidencePct,
      },
      auto_reply: autoReplyText,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('WhatsApp webhook error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

