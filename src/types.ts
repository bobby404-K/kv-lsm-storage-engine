export interface KeyValueRecord {
  key: string;
  value: string;
  deleted?: boolean;
  timestamp: number;
}

export interface SSTableMetadata {
  id: string;
  level: number;
  minKey: string;
  maxKey: string;
  recordCount: number;
  bloomFilterBits: number[];
}
