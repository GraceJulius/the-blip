export const QUESTS = [
  { id: 'autopay', title: 'Set up autopay', event: 'autopay_enabled', points: 150, category: 'credit' },
  { id: 'on_time', title: 'Pay a card before the due date', event: 'payment_on_time', points: 200, category: 'credit' },
  { id: 'util', title: 'Get utilization under 30%', event: 'utilization_under_30', points: 200, category: 'credit' },
  { id: 'payoff_plan', title: 'Write your payoff plan', event: 'payoff_plan_written', points: 100, category: 'planning' },
  { id: 'emergency', title: 'Start a $100 emergency fund', event: 'emergency_fund_started', points: 150, category: 'planning' },
  { id: 'credit_report', title: 'Check your credit report once', event: 'credit_report_checked', points: 100, category: 'credit' },
  { id: 'statement', title: 'Read your real card statement', event: 'statement_read', points: 100, category: 'credit' },
  { id: 'receipt', title: 'Add real prices from a receipt', event: 'receipt_saved', points: 100, category: 'food' },
  { id: 'basket', title: 'Compare a grocery basket at 3 stores', event: 'basket_compared', points: 100, category: 'food' },
];

export const SCAM_REPORT = { points: 25, dailyCap: 5 };
export const QUIZ_BONUS = { points: 25, dailyCap: 3 };
export const INCIDENT_REPORT_POINTS = 25;
export const RECOVERY_COMPLETE_POINTS = 100;
export const REDEEM_COST = 300;

export const RECOVERY_STEPS = [
  { id: 'freeze_card', title: 'Freeze the card', hint: 'In the real product the bank confirms this automatically.', bankEvent: 'card_frozen' },
  { id: 'change_passwords', title: 'Change passwords for accounts you use', hint: 'Start with email and banking.' },
  { id: 'report', title: 'Report it to your bank and to reportfraud.ftc.gov', hint: 'Reporting helps other students too.' },
];

export const QUIZ = [
  { q: 'You clicked a scam link but entered nothing. What is the best first move?', options: ['Ignore it', 'Change passwords and watch for odd activity', 'Reply to the sender'], answer: 1 },
  { q: 'Someone says they are your bank and asks for a code they just texted you. You:', options: ['Read the code to them', 'Hang up and call the number on your card', 'Text the code back'], answer: 1 },
  { q: 'Who should hear about a card scam first?', options: ['Nobody', 'Your bank', 'The sender'], answer: 1 },
];

export const ASSUMPTIONS = { enrolled: 5000, completionRate: 0.38, questsEach: 3, costPerQuest: 1.5, avoidedPerQuest: 4 };
