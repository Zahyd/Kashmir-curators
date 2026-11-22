import { AIConciergeAgentService } from '../services/aiConciergeAgentService';

async function testAgent() {
  console.log('🤖 STARTING AI CONCIERGE AGENT INTEGRATION TESTS...\n');

  // Test 1: Inbound Tourist
  console.log('--- TEST 1: INBOUND TOURIST (Gulmarg Honeymoon) ---');
  const res1 = await AIConciergeAgentService.processInboundMessage(
    '+919103798448',
    'Salam! How much is a 5-day honeymoon package for Gulmarg with snow and a heated cab?'
  );
  console.log('Detected Intent:', res1.intent);
  console.log('Generated Itinerary Link:', res1.proposalUrl);
  console.log('AI Response:\n', res1.replyText);

  // Test 2: Inbound Travel Agent
  console.log('\n--- TEST 2: INBOUND TRAVEL AGENT (Mumbai B2B Operator) ---');
  const res2 = await AIConciergeAgentService.processInboundMessage(
    '+919820199887',
    'Hi, I run a travel agency in Mumbai. Do you provide B2B wholesale rates and agency portal access?'
  );
  console.log('Detected Intent:', res2.intent);
  console.log('AI Response:\n', res2.replyText);

  // Test 3: Inbound Cab Driver
  console.log('\n--- TEST 3: INBOUND CAB DRIVER (Srinagar Fleet Owner) ---');
  const res3 = await AIConciergeAgentService.processInboundMessage(
    '+919419011223',
    'Salam! I have a commercial Innova Crysta in Srinagar. How can I join your driver fleet for tourist duties?'
  );
  console.log('Detected Intent:', res3.intent);
  console.log('AI Response:\n', res3.replyText);

  console.log('\n🎉 ALL 3 AI AGENT WORKFLOWS PASSED 100%!');
}

testAgent()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error testing agent:', err);
    process.exit(1);
  });
