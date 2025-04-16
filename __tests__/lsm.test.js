import assert from 'node:assert';
import test from 'node:test';
import { LSMStorageEngine } from '../dist/lsm-engine.js';

test('LSMStorageEngine flushes MemTable to SSTables and handles tombstones', () => {
  const engine = new LSMStorageEngine(3);
  engine.put('k1', 'v1');
  engine.put('k2', 'v2');
  engine.put('k3', 'v3'); // Triggers flush

  assert.strictEqual(engine.get('k1'), 'v1');
  assert.strictEqual(engine.get('k2'), 'v2');

  engine.delete('k2');
  assert.strictEqual(engine.get('k2'), null);
});
