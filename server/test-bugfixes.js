const assert = require('assert');
const { generateFingerprint } = require('./fingerprint');

console.log('Running fingerprint bug-fix assertions...');

// 1. Same fingerprint for "User 4821 not found" vs "User 9937 not found" with no stack
const fpNumber1 = generateFingerprint({
  type: 'NotFoundError',
  message: 'User 4821 not found',
  stack: '',
});
const fpNumber2 = generateFingerprint({
  type: 'NotFoundError',
  message: 'User 9937 not found',
  stack: '',
});
assert.strictEqual(
  fpNumber1,
  fpNumber2,
  'Expected identical fingerprints for "User 4821 not found" and "User 9937 not found"'
);
console.log('✓ Passed: Dynamic numbers in fallback messages produce identical fingerprints.');

// 2. Same fingerprint when only line numbers differ
const stackLine10 = `TypeError: Cannot read properties of undefined
    at getUser (services/userService.js:10:5)
    at handleRequest (controllers/userController.js:24:12)`;

const stackLine85 = `TypeError: Cannot read properties of undefined
    at getUser (services/userService.js:85:19)
    at handleRequest (controllers/userController.js:104:3)`;

const fpStack1 = generateFingerprint({
  type: 'TypeError',
  message: 'Cannot read properties of undefined',
  stack: stackLine10,
});
const fpStack2 = generateFingerprint({
  type: 'TypeError',
  message: 'Cannot read properties of undefined',
  stack: stackLine85,
});
assert.strictEqual(
  fpStack1,
  fpStack2,
  'Expected identical fingerprints when only stack line numbers differ'
);
console.log('✓ Passed: Line number shifts in call stack produce identical fingerprints.');

// 3. A message containing an email does not change the fingerprint when a stack exists
const stackWithEmail = `TypeError: Failed to send report to admin@example.com
    at sendMail (mailer.js:45:10)
    at dispatch (queue.js:12:3)`;

const stackWithoutEmail = `TypeError: Failed to send report
    at sendMail (mailer.js:45:10)
    at dispatch (queue.js:12:3)`;

const fpEmailHeader = generateFingerprint({
  type: 'TypeError',
  message: 'Failed to send report to admin@example.com',
  stack: stackWithEmail,
});
const fpNoEmailHeader = generateFingerprint({
  type: 'TypeError',
  message: 'Failed to send report',
  stack: stackWithoutEmail,
});
assert.strictEqual(
  fpEmailHeader,
  fpNoEmailHeader,
  'Expected message containing an email not to alter fingerprint when stack frames exist'
);
console.log('✓ Passed: Error headers containing emails do not pollute stack frames or alter fingerprint.');

console.log('\nAll fingerprint bug-fix assertions passed successfully!');
