import { convertTemperature } from './temperature.js';

const inputs = [...document.querySelectorAll('.converter input')];
const feedback = document.querySelector('#feedback');

function format(value) {
  // Suppress floating-point noise and negative zero in displayed results only.
  return String(Number(value.toPrecision(8)) || 0);
}

for (const source of inputs) {
  source.addEventListener('input', () => {
    const result = convertTemperature(source.value, source.name);
    for (const input of inputs) {
      input.removeAttribute('aria-invalid');
      if (input !== source) {
        input.value = result.status === 'success' ? format(result.values[input.name]) : '';
      }
    }
    feedback.classList.toggle('error', result.status === 'error');
    if (result.status === 'error') {
      source.setAttribute('aria-invalid', 'true');
      feedback.textContent = result.message;
    } else if (result.status === 'empty') {
      feedback.textContent = 'Enter a temperature to get started.';
    } else {
      const labels = { celsius: '°C', fahrenheit: '°F', kelvin: 'K' };
      feedback.textContent = inputs.map(input => `${input.value} ${labels[input.name]}`).join(' = ');
    }
  });
}
