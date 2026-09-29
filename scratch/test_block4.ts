import { NextRequest } from 'next/server';
import { GET as getManagement } from '../app/api/districts/[id]/management/route';
import { POST as postStaff } from '../app/api/districts/[id]/staff/route';
import { POST as postActions } from '../app/api/districts/[id]/actions/route';
import { registerDemoSession } from '../lib/auth';

async function runBlock4Tests() {
  console.log('🧪 [BLOCK 4 TEST] Starting Verification of District Management Engine...');

  const demoAdminToken = 'demo-token-admin-test-b4';
  const demoAdminId = '44444444-4444-4444-8444-444444444444'; // State Admin
  registerDemoSession(demoAdminToken, demoAdminId);

  // 1. Unauthorized GET request (should return 401)
  console.log('Testing 1: Unauthorized access check...');
  const unauthReq = new NextRequest('http://localhost:3000/api/districts/Pune/management', {
    method: 'GET',
  });
  const unauthRes = await getManagement(unauthReq, { params: { id: 'Pune' } });
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
  }
  console.log('✅ TEST 1 PASSED: Unauthorized request properly rejected with 401.');

  // 2. Authorized GET request
  console.log('Testing 2: Authorized GET /api/districts/Pune/management...');
  const authReq = new NextRequest('http://localhost:3000/api/districts/Pune/management', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${demoAdminToken}`,
    },
  });
  const authRes = await getManagement(authReq, { params: { id: 'Pune' } });
  const authData = await authRes.json();
  if (authRes.status !== 200) {
    throw new Error(`Expected 200, got ${authRes.status}: ${JSON.stringify(authData)}`);
  }
  if (!authData.data?.district || authData.data.district.name !== 'Pune') {
    throw new Error(`Expected district Pune, got: ${JSON.stringify(authData.data?.district)}`);
  }
  if (!authData.data.riskAssessment?.subscores) {
    throw new Error('Expected riskAssessment.subscores in response');
  }
  console.log('✅ TEST 2 PASSED: District management telemetry returned successfully:', {
    district: authData.data.district.name,
    riskScore: authData.data.riskAssessment.riskScore,
    riskLevel: authData.data.riskAssessment.riskLevel,
    staffCount: authData.data.staffAssignments.length,
    actionsCount: authData.data.adminActions.length,
  });

  // 3. POST /api/districts/Pune/staff (Assign staff member)
  console.log('Testing 3: Assigning staff member to Pune district...');
  const vetUserId = '22222222-2222-4222-8222-222222222222'; // Dr. Vijay Shinde
  const staffReq = new NextRequest('http://localhost:3000/api/districts/Pune/staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoAdminToken}`,
    },
    body: JSON.stringify({
      userId: vetUserId,
      role: 'District Epidemiological Lead',
    }),
  });
  const staffRes = await postStaff(staffReq, { params: { id: 'Pune' } });
  const staffData = await staffRes.json();
  if (staffRes.status !== 200) {
    throw new Error(`Expected 200 for staff assignment, got ${staffRes.status}: ${JSON.stringify(staffData)}`);
  }
  if (staffData.data.role !== 'District Epidemiological Lead') {
    throw new Error(`Unexpected role: ${staffData.data.role}`);
  }
  console.log('✅ TEST 3 PASSED: Staff member successfully assigned:', staffData.data.user?.full_name);

  // 4. POST /api/districts/Pune/actions (Record intervention)
  console.log('Testing 4: Recording district intervention...');
  const actionReq = new NextRequest('http://localhost:3000/api/districts/Pune/actions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoAdminToken}`,
    },
    body: JSON.stringify({
      action_type: 'intervention',
      notes: 'Emergency ring vaccination campaign initiated across 12 border villages.',
    }),
  });
  const actionRes = await postActions(actionReq, { params: { id: 'Pune' } });
  const actionData = await actionRes.json();
  if (actionRes.status !== 200) {
    throw new Error(`Expected 200 for action recording, got ${actionRes.status}`);
  }
  console.log('✅ TEST 4 PASSED: Intervention recorded successfully.');

  // 5. POST /api/districts/Pune/actions (Manual risk override)
  console.log('Testing 5: Recording manual risk score override...');
  const overrideReq = new NextRequest('http://localhost:3000/api/districts/Pune/actions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoAdminToken}`,
    },
    body: JSON.stringify({
      action_type: 'risk_override',
      notes: 'Local market intelligence indicates sudden surge in foot lesions.',
      override_level: 'critical',
    }),
  });
  const overrideRes = await postActions(overrideReq, { params: { id: 'Pune' } });
  const overrideData = await overrideRes.json();
  if (overrideRes.status !== 200) {
    throw new Error(`Expected 200 for risk override, got ${overrideRes.status}`);
  }
  console.log('✅ TEST 5 PASSED: Manual risk override recorded.');

  // 6. Verify State Persistence via subsequent GET /api/districts/Pune/management
  console.log('Testing 6: Verifying state persistence on subsequent GET...');
  const verifyReq = new NextRequest('http://localhost:3000/api/districts/Pune/management', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${demoAdminToken}`,
    },
  });
  const verifyRes = await getManagement(verifyReq, { params: { id: 'Pune' } });
  const verifyData = await verifyRes.json();
  const assigned = verifyData.data.staffAssignments.find((s: any) => s.user_id === vetUserId);
  if (!assigned || assigned.role !== 'District Epidemiological Lead') {
    throw new Error('Failed to find newly assigned staff in district roster');
  }

  const latestOverrideAction = verifyData.data.adminActions.find(
    (a: any) => a.action_type === 'risk_override' && a.override_level === 'critical'
  );
  if (!latestOverrideAction) {
    throw new Error('Failed to find latest override action in admin actions log');
  }
  console.log('✅ TEST 6 PASSED: State persistence fully verified across roster and interventions.');
  console.log('🎉 ALL BLOCK 4 VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runBlock4Tests().catch((err) => {
  console.error('❌ BLOCK 4 TEST FAILED:', err);
  process.exit(1);
});

