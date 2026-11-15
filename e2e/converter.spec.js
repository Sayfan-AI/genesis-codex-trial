import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

for (const [unit, input, values] of [
  ['Celsius', '001.50', ['001.50', '34.7', '274.65']],
  ['Fahrenheit', '-40', ['-40', '-40', '233.15']],
  ['Kelvin', '0', ['-273.15', '-459.67', '0']],
]) {
  test(`${unit} drives conversion and preserves the source`, async ({ page }) => {
    const source = page.getByRole('textbox', { name: unit });
    await source.fill(input);
    for (const [index, name] of ['Celsius', 'Fahrenheit', 'Kelvin'].entries()) {
      await expect(page.getByRole('textbox', { name })).toHaveValue(values[index]);
    }
    await expect(source).toBeFocused();
    await expect(source).not.toHaveAttribute('aria-invalid');
  });
}

test('clearing an input clears every field', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Celsius' }).fill('20');
  await page.getByRole('textbox', { name: 'Fahrenheit' }).fill('');
  for (const input of await page.getByRole('textbox').all()) await expect(input).toHaveValue('');
  await expect(page.getByRole('status')).toHaveText('Enter a temperature to get started.');
});

for (const [name, value, message] of [
  ['Celsius', 'hello', 'Enter a valid finite number.'],
  ['Celsius', '-', 'Enter a valid finite number.'],
  ['Celsius', 'Infinity', 'Enter a valid finite number.'],
  ['Celsius', '-273.16', 'Temperature must be at or above absolute zero.'],
  ['Fahrenheit', '-459.68', 'Temperature must be at or above absolute zero.'],
  ['Kelvin', '-1', 'Temperature must be at or above absolute zero.'],
]) {
  test(`${name} ${value} clears stale results and reports validation`, async ({ page }) => {
    await page.getByRole('textbox', { name: 'Celsius' }).fill('20');
    const source = page.getByRole('textbox', { name });
    await source.fill(value);
    await expect(source).toHaveValue(value);
    await expect(source).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('status')).toHaveText(message);
    for (const input of await page.getByRole('textbox').all()) {
      if (await input.getAttribute('name') !== name.toLowerCase()) await expect(input).toHaveValue('');
    }
    await source.fill('10');
    await expect(source).not.toHaveAttribute('aria-invalid');
    await expect(page.getByRole('status')).not.toHaveText(message);
  });
}

test('keyboard order, labels, and responsive bounds', async ({ page }) => {
  await page.keyboard.press('Tab');
  for (const name of ['Celsius', 'Fahrenheit', 'Kelvin']) {
    await expect(page.getByRole('textbox', { name })).toBeFocused();
    await page.keyboard.press('Tab');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const field of await page.getByRole('textbox').all()) {
    const box = await field.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
  }
});
