import { test } from 'node:test';
import assert from 'node:assert/strict';
import { brandColors, brandStyle } from '../lib/brand.ts';
import { emptyDocument, validateDocument } from '../lib/content-schema.ts';

test('older content keeps the current palette and valid edited colors persist', () => {
  assert.deepEqual(brandColors(emptyDocument), {green:'#1A1E3A',gold:'#DB8C59'});
  const document = validateDocument({text:{'brand.green':'#123456','brand.gold':'#fedcba'},images:{}});
  assert.deepEqual(brandColors(document), {green:'#123456',gold:'#fedcba'});
  assert.match(brandStyle(document), /--brand-green:#123456;--brand-gold:#fedcba/);
  assert.match(brandStyle(document), /--brand-green-rgb:18 52 86/);
});
test('palette settings reject CSS injection and invalid colors; rendering falls back safely', () => {
  for (const value of ['red','#123','#12345678','</style><script>','var(--green)','']) {
    const document={text:{'brand.green':value},images:{}};
    assert.throws(()=>validateDocument(document));
    assert.equal(brandColors(document).green,'#1A1E3A');
  }
});
