/** Absolute zero in each supported unit. */
export const ABSOLUTE_ZERO = Object.freeze({
  celsius: -273.15,
  fahrenheit: -459.67,
  kelvin: 0,
});

const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

/**
 * Convert a number or decimal input string to all three units.
 * Returns {status: 'empty'}, {status: 'error', message}, or
 * {status: 'success', values: {celsius, fahrenheit, kelvin}}.
 * Results retain numeric precision; the UI owns display formatting.
 */
export function convertTemperature(input, unit) {
  if (!Object.hasOwn(ABSOLUTE_ZERO, unit)) {
    return { status: 'error', message: 'Choose Celsius, Fahrenheit, or Kelvin.' };
  }

  if (typeof input === 'string') {
    input = input.trim();
    if (input === '') return { status: 'empty' };
    if (!DECIMAL.test(input)) {
      return { status: 'error', message: 'Enter a valid finite number.' };
    }
    input = Number(input);
  }
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    return { status: 'error', message: 'Enter a valid finite number.' };
  }
  // Compare in the source unit so rounding during conversion can't reject zero.
  if (input < ABSOLUTE_ZERO[unit]) {
    return { status: 'error', message: 'Temperature must be at or above absolute zero.' };
  }

  let values;
  switch (unit) {
    case 'celsius':
      values = { celsius: input, fahrenheit: input * 1.8 + 32, kelvin: input + 273.15 };
      break;
    case 'fahrenheit':
      values = {
        celsius: (input - 32) / 1.8,
        fahrenheit: input,
        kelvin: (input - ABSOLUTE_ZERO.fahrenheit) / 1.8,
      };
      break;
    case 'kelvin':
      values = {
        celsius: input - 273.15,
        fahrenheit: input * 1.8 + ABSOLUTE_ZERO.fahrenheit,
        kelvin: input,
      };
      break;
  }
  if (!Object.values(values).every(Number.isFinite)) {
    return { status: 'error', message: 'Temperature is too large to convert.' };
  }
  return { status: 'success', values };
}
