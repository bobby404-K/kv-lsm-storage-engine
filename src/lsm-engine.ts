import { KeyValueRecord, SSTableMetadata } from './types.js';

export class LSMStorageEngine {
  private memtable = new Map<string, KeyValueRecord>();
  private walLog: KeyValueRecord[] = [];
  private sstables: Array<{ meta: SSTableMetadata; data: Map<string, KeyValueRecord> }> = [];
  private memtableThreshold: number;

  constructor(memtableThreshold = 50) {
    this.memtableThreshold = memtableThreshold;
  }

  put(key: string, value: string): void {
    const record: KeyValueRecord = { key, value, timestamp: Date.now() };
    this.walLog.push(record); // Append to Write-Ahead Log
    this.memtable.set(key, record);

    if (this.memtable.size >= this.memtableThreshold) {
      this.flushMemTable();
    }
  }

  delete(key: string): void {
    const tombstone: KeyValueRecord = { key, value: '', deleted: true, timestamp: Date.now() };
    this.walLog.push(tombstone);
    this.memtable.set(key, tombstone);
  }

  get(key: string): string | null {
    // 1. Check MemTable (fastest)
    if (this.memtable.has(key)) {
      const rec = this.memtable.get(key)!;
      return rec.deleted ? null : rec.value;
    }

    // 2. Search SSTables from newest to oldest
    for (let i = this.sstables.length - 1; i >= 0; i--) {
      const table = this.sstables[i];
      if (key >= table.meta.minKey && key <= table.meta.maxKey) {
        if (table.data.has(key)) {
          const rec = table.data.get(key)!;
          return rec.deleted ? null : rec.value;
        }
      }
    }

    return null;
  }

  private flushMemTable(): void {
    const sorted = Array.from(this.memtable.entries()).sort(([a], [b]) => a.localeCompare(b));
    if (sorted.length === 0) return;

    const dataMap = new Map(sorted);
    const meta: SSTableMetadata = {
      id: `sst_${Date.now()}_${this.sstables.length}`,
      level: 0,
      minKey: sorted[0][0],
      maxKey: sorted[sorted.length - 1][0],
      recordCount: sorted.length,
      bloomFilterBits: []
    };

    this.sstables.push({ meta, data: dataMap });
    this.memtable.clear();
    this.walLog = []; // Truncate WAL after successful disk flush
  }
}
