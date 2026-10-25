import { appendFileSync } from 'node:fs';

const payloadRaw = process.env.INPUT_PAYLOAD;
const outputPath = process.env.GITHUB_OUTPUT;

if (typeof payloadRaw !== 'string') {
  throw new Error('Invalid input: INPUT_PAYLOAD must be a JSON string');
}
if (typeof outputPath !== 'string' || outputPath.length === 0) {
  throw new Error('Invalid environment: GITHUB_OUTPUT must be set');
}

let parsed;
try {
  parsed = JSON.parse(payloadRaw);
} catch {
  throw new Error('Invalid input: INPUT_PAYLOAD must be valid JSON');
}

if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
  throw new Error('Invalid input: payload must be an object');
}

const hasOwn = Object.prototype.hasOwnProperty;
if (!hasOwn.call(parsed, 'value') || !hasOwn.call(parsed, 'required')) {
  throw new Error('Invalid input: payload must contain value and required');
}

const value = parsed.value;
const required = parsed.required;

if (value === null || typeof value !== 'object' || Array.isArray(value)) {
  throw new Error('Invalid input: value must be a plain object');
}
if (required === null || !Array.isArray(required)) {
  throw new Error('Invalid input: required must be an array');
}

const seen = new Set();
for (let i = 0; i < required.length; i += 1) {
  const k = required[i];
  if (typeof k !== 'string' || k.length === 0) {
    throw new Error('Invalid input: required entries must be non-empty strings');
  }
  if (seen.has(k)) {
    throw new Error('Invalid input: required entries must be unique');
  }
  seen.add(k);
}

const present = [];
const missing = [];
for (const k of seen) {
  if (hasOwn.call(value, k)) {
    present.push(k);
  } else {
    missing.push(k);
  }
}

present.sort();
missing.sort();

const result = {
  missing,
  ok: missing.length === 0,
  present
};

appendFileSync(outputPath, `result=${JSON.stringify(result)}\n`);