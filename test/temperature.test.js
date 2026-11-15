import assert from 'node:assert/strict';
import test from 'node:test';
import { ABSOLUTE_ZERO, convertTemperature } from '../src/temperature.js';

const units = ['celsius', 'fahrenheit', 'kelvin'];
function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)),
    `expected ${actual} to be close to ${expected}`);
}

// Each row checks every source unit against independently known reference values.
for (const [name, temperatures] of [
  ['freezing', [0, 32, 273.15]],
  ['boiling', [100, 212, 373.15]],
  ['negative crossing', [-40, -40, 233.15]],
  ['decimal', [36.5, 97.7, 309.65]],
  ['absolute zero', [-273.15, -459.67, 0]],
]) {
  for (const [sourceIndex, source] of units.entries()) {
    test(`${name} from ${source} converts to every unit`, () => {
      const result = convertTemperature(temperatures[sourceIndex], source);
      assert.equal(result.status, 'success');
      for (const [targetIndex, target] of units.entries()) {
        close(result.values[target], temperatures[targetIndex]);
      }
      assert.equal(result.values[source], temperatures[sourceIndex]);
    });
  }
}

for (const source of units) {
  test(`round trips from ${source}`, () => {
    for (const input of [ABSOLUTE_ZERO[source], ABSOLUTE_ZERO[source] + 1e-9,
      ABSOLUTE_ZERO[source] / 2, 0.125, 123.456, 10000.25]) {
      const result = convertTemperature(input, source);
      for (const target of units) {
        const roundTrip = convertTemperature(result.values[target], target);
        assert.equal(roundTrip.status, 'success');
        close(roundTrip.values[source], input);
      }
    }
  });
  test(`rejects below absolute zero in ${source}`, () => {
    const result = convertTemperature(ABSOLUTE_ZERO[source] - 1e-9, source);
    assert.equal(result.status, 'error');
    assert.match(result.message, /absolute zero/);
    assert.equal(result.values, undefined);
  });
  test(`accepts just above absolute zero in ${source}`, () => {
    const result = convertTemperature(ABSOLUTE_ZERO[source] + 1e-9, source);
    assert.equal(result.status, 'success');
    assert.ok(result.values.kelvin >= 0);
  });
}

test('empty and whitespace input produce no results', () => {
  for (const input of ['', ' ', '\t\n']) {
    assert.deepEqual(convertTemperature(input, 'celsius'), { status: 'empty' });
  }
});

test('decimal strings accept signs, spaces, fractions, and exponents', () => {
  for (const [input, expected] of [[' +12.5 ', 12.5], ['-.5', -0.5], ['1.', 1], ['1e2', 100]]) {
    const result = convertTemperature(input, 'celsius');
    assert.equal(result.status, 'success');
    assert.equal(result.values.celsius, expected);
  }
});

test('invalid, partial, and non-finite input yields an error without stale values', () => {
  for (const input of ['abc', '12abc', '-', '.', '1e', '0x10', '1,000', 'Infinity', 'NaN', '1e309',
    NaN, Infinity, -Infinity, undefined, null, true, [], {}]) {
    const result = convertTemperature(input, 'celsius');
    assert.equal(result.status, 'error', `input: ${String(input)}`);
    assert.match(result.message, /finite number/);
    assert.equal(result.values, undefined);
  }
});

test('unknown unit yields a clear validation error', () => {
  for (const unit of ['C', 'rankine', 'toString', '__proto__', undefined]) {
    const result = convertTemperature(0, unit);
    assert.equal(result.status, 'error');
    assert.match(result.message, /Choose/);
  }
});

test('conversion overflow is rejected instead of returning Infinity', () => {
  const result = convertTemperature(Number.MAX_VALUE, 'celsius');
  assert.equal(result.status, 'error');
  assert.match(result.message, /too large/);
  assert.equal(result.values, undefined);
});
