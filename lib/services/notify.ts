import { createAdminClient } from '@/lib/supabase/server';
import type { NotificationChannel, PreferredLanguage } from '@/types/database.types';
import { sendEmail } from '@/lib/email';

export interface NotificationTemplateParams {
  disease?: string;
  district?: string;
  animalTag?: string;
  vaccineName?: string;
  dueDate?: string;
  result?: string;
  advisoryTitle?: string;
}

export type NotificationTemplateType =
  | 'outbreak_alert'
  | 'vaccination_reminder'
  | 'lab_result_ready'
  | 'advisory_broadcast';

export const NOTIFICATION_TEMPLATES: Record<
  NotificationTemplateType,
  Record<PreferredLanguage, (p: NotificationTemplateParams) => string>
> = {
  outbreak_alert: {
    en: (p) =>
      `[ALERT] Outbreak of ${p.disease || 'Livestock Disease'} reported in ${p.district || 'your district'}. Please isolate symptomatic animals and report immediately.`,
    hi: (p) =>
      `[चेतावनी] ${p.district || 'आपके जिले'} में ${p.disease || 'पशु रोग'} का प्रकोप दर्ज किया गया है। कृपया संदिग्ध पशुओं को अलग रखें और तुरंत रिपोर्ट करें।`,
    mr: (p) =>
      `[सतर्कता] ${p.district || 'आपल्या जिल्ह्यात'} ${p.disease || 'पशु रोग'} चा प्रादुर्भाव आढळला आहे. कृपया संशयित जनावरांना वेगळे ठेवा आणि त्वरित नोंदवा.`,
  },
  vaccination_reminder: {
    en: (p) =>
      `[REMINDER] Vaccination (${p.vaccineName || 'Scheduled Dose'}) is due for Animal Tag #${p.animalTag || ''} on ${p.dueDate || 'soon'}. Open health card for schedule.`,
    hi: (p) =>
      `[स्मरणपत्र] पशु टैग #${p.animalTag || ''} के लिए टीकाकरण (${p.vaccineName || 'नियत खुराक'}) ${p.dueDate || 'जल्द'} देय है। विवरण हेतु हेल्थ कार्ड देखें।`,
    mr: (p) =>
      `[स्मरणपत्र] जनावर टॅग #${p.animalTag || ''} साठी लसीकरण (${p.vaccineName || 'नियोजित मात्रा'}) ${p.dueDate || 'लवकरच'} देय आहे. वेळापत्रकासाठी हेल्थ कार्ड पहा.`,
  },
  lab_result_ready: {
    en: (p) =>
      `[LAB UPDATE] Diagnostic test completed for sample linked to Animal Tag #${p.animalTag || ''}. Result: ${p.result || 'Available in portal'}.`,
    hi: (p) =>
      `[लैब रिपोर्ट] पशु टैग #${p.animalTag || ''} के सैंपल की जांच पूर्ण हुई। परिणाम: ${p.result || 'पोर्टल पर उपलब्ध'}।`,
    mr: (p) =>
      `[लॅब अहवाल] जनावर टॅग #${p.animalTag || ''} च्या नमुन्याची तपासणी पूर्ण झाली. निष्कर्ष: ${p.result || 'पोर्टलवर उपलब्ध'} आहे.`,
  },
  advisory_broadcast: {
    en: (p) =>
      `[VET ADVISORY] New advisory for ${p.district || 'Maharashtra'}: ${p.advisoryTitle || 'Livestock health guidelines published'}.`,
    hi: (p) =>
      `[पशु चिकित्सा सलाह] ${p.district || 'महाराष्ट्र'} के लिए नई सलाह: ${p.advisoryTitle || 'पशु स्वास्थ्य निर्देश जारी'}।`,
    mr: (p) =>
      `[पशुवैद्यकीय सल्ला] ${p.district || 'महाराष्ट्र'} साठी नवीन सूचना: ${p.advisoryTitle || 'पशु आरोग्य मार्गदर्शक तत्त्वे जारी'}।`,
  },
};

export interface SendNotificationOptions {
  userId: string;
  channel?: NotificationChannel;
  language?: PreferredLanguage;
  template?: NotificationTemplateType;
  params?: NotificationTemplateParams;
  rawMessage?: string;
  email?: string;
  phone?: string;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  status: 'delivered' | 'mock_sent' | 'skipped' | 'failed';
  isMock: boolean;
  message: string;
  logId?: string;
}

/**
 * Dispatch notifications across channels with trilingual templates.
 * In-app: saved to DB as delivered.
 * Email: sent via direct Resend REST API if RESEND_API_KEY is configured, else logged as delivered.
 * SMS/WhatsApp: Mock sent only (explicitly marked).
 */
export async function sendNotification(options: SendNotificationOptions): Promise<NotificationResult> {
  const channel = options.channel || 'inapp';
  const language = options.language || 'en';

  let message = options.rawMessage || '';
  if (!message && options.template) {
    const templateFn = NOTIFICATION_TEMPLATES[options.template]?.[language] || NOTIFICATION_TEMPLATES[options.template]?.en;
    message = templateFn ? templateFn(options.params || {}) : 'Notification from Pashudhan Kavach';
  }

  let deliveryStatus: string = 'delivered';
  let isMock = false;

  if (channel === 'sms' || channel === 'whatsapp') {
    deliveryStatus = 'mock_sent';
    isMock = true;
  } else if (channel === 'email') {
    if (options.email) {
      await sendEmail({
        to: options.email,
        subject: 'Pashudhan Kavach Alert',
        html: `<p>${message}</p>`,
      });
    }
    deliveryStatus = 'delivered';
  }

  // Record to DB notification_log
  let logId: string | undefined;
  try {
    const admin = createAdminClient();
    const { data, error } = await (admin.from('notification_log') as any)
      .insert({
        user_id: options.userId,
        channel,
        language,
        message,
        status: deliveryStatus,
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (!error && data) {
      logId = data.id;
    }
  } catch (err) {
    console.error('Failed to write notification_log:', err);
  }

  return {
    success: true,
    channel,
    status: deliveryStatus as any,
    isMock,
    message,
    logId,
  };
}

