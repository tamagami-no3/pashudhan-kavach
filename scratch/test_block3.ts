import { NextRequest } from 'next/server';
import { POST } from '../app/api/chatbot/diagnose/route';

async function runBlock3Tests() {
  console.log('🧪 [BLOCK 3 TEST] Starting Verification of Webcam / CV Signal Pipeline...');

  // 1. Mock Request with visual_signal & simulated base64 image (1x1 transparent PNG)
  const sample1x1Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const mockSignals = [
    { className: 'ox, bull', probability: 0.84 },
    { className: 'water buffalo', probability: 0.11 },
  ];

  const reqBody = {
    message: 'माझ्या गाईच्या अंगावर गाठी आल्या आहेत आणि ताप आहे',
    imageBase64: sample1x1Png,
    imageMediaType: 'image/png',
    visual_signal: mockSignals,
    language: 'mr' as const,
  };

  const mockReq = new NextRequest('http://localhost:3000/api/chatbot/diagnose', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqBody),
  });

  const res = await POST(mockReq);
  const data = await res.json();

  console.log('Response Status:', res.status);
  console.log('Diagnosis Result:', {
    predicted_disease: data.predicted_disease,
    confidence_level: data.confidence_level,
    alert_level: data.alert_level,
    visual_signal: data.visual_signal,
    precautions_count: data.precautions?.length,
  });

  // Verification Checks:
  if (res.status !== 200) {
    throw new Error(`Expected status 200, got ${res.status}`);
  }

  if (!data.predicted_disease && !data.reply) {
    throw new Error('Expected predicted_disease or reply in response');
  }

  if (!Array.isArray(data.visual_signal) || data.visual_signal.length !== 2) {
    throw new Error(`Expected visual_signal array of length 2, got: ${JSON.stringify(data.visual_signal)}`);
  }

  if (data.visual_signal[0].className !== 'ox, bull') {
    throw new Error(`Expected first class to be 'ox, bull', got ${data.visual_signal[0].className}`);
  }

  console.log('✅ TEST 1 PASSED: Diagnose endpoint successfully processed visual_signal alongside symptoms and image.');

  // 2. Test without visual_signal (backward compatibility check)
  const reqBodyNoSignal = {
    message: 'गाईला लाळ गळत आहे आणि पायाला जखमा आहेत',
    language: 'mr' as const,
  };
  const mockReq2 = new NextRequest('http://localhost:3000/api/chatbot/diagnose', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqBodyNoSignal),
  });
  const res2 = await POST(mockReq2);
  const data2 = await res2.json();

  if (res2.status !== 200) {
    throw new Error(`Expected status 200, got ${res2.status}`);
  }
  if (!Array.isArray(data2.visual_signal)) {
    throw new Error('Expected visual_signal to be an array even when not provided');
  }

  console.log('✅ TEST 2 PASSED: Backward compatibility verified without visual_signal.');
  console.log('🎉 ALL BLOCK 3 VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runBlock3Tests().catch((err) => {
  console.error('❌ BLOCK 3 TEST FAILED:', err);
  process.exit(1);
});

