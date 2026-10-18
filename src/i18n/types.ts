// Translation system types and utilities.
// Languages: 'bn' = Bengali (default), 'en' = English.

export type Lang = 'bn' | 'en';

export type Dict = Record<string, string>;

export type Interpolation = Record<string, string | number>;

export type StatusKind =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'locked'
  | 'released'
  | 'cleared'
  | 'encroached'
  | 'disputed'
  | 'paid'
  | 'overdue'
  | 'high_risk'
  | 'medium_risk'
  | 'low_risk'
  | 'shikosti'
  | 'poyosti'
  | 'stable'
  | 'eroded'
  | 'newly_formed';

export type FraudKind =
  | 'duplicate_deed'
  | 'benami'
  | 'forgery'
  | 'fake_encumbrance'
  | 'fake_mutation'
  | 'identity_mismatch';

export const isLang = (v: unknown): v is Lang => v === 'bn' || v === 'en';
