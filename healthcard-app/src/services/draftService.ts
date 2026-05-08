import type { HealthCardFormValues } from '../types/domain';

const DRAFT_STORAGE_KEY = 'healthcard_encoder_drafts_v1';
const MAX_LOCAL_STORAGE_BYTES = 5 * 1024 * 1024;

const STEP_LABELS = [
  'Personal Info',
  'Address',
  'Emergency',
  'Medical History',
  'Employment',
  'Insurance',
  'Requirements',
  'Review',
] as const;

export interface EncoderDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
  step: number;
  values: HealthCardFormValues;
}

export interface EncoderDraftSummary {
  id: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
  step: number;
  lastStepLabel: string;
  progressPercent: number;
}

type StoredDraftMap = Record<string, EncoderDraft[]>;

const clampStep = (step: number) => Math.min(Math.max(0, step), STEP_LABELS.length - 1);

const readDraftMap = (): StoredDraftMap => {
  const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as StoredDraftMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeDraftMap = (draftMap: StoredDraftMap) => {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftMap));
};

const toClientName = (values: HealthCardFormValues) => {
  const fullName = [values.first_name, values.middle_name, values.last_name, values.suffix]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');

  return fullName || 'Unnamed Client';
};

const toSummary = (draft: EncoderDraft): EncoderDraftSummary => {
  const normalizedStep = clampStep(draft.step);
  return {
    id: draft.id,
    clientName: toClientName(draft.values),
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    step: normalizedStep,
    lastStepLabel: `Step ${normalizedStep + 1}: ${STEP_LABELS[normalizedStep]}`,
    progressPercent: Math.round(((normalizedStep + 1) / STEP_LABELS.length) * 100),
  };
};

export const draftService = {
  listDrafts(encoderId: string): EncoderDraft[] {
    const draftMap = readDraftMap();
    const drafts = draftMap[encoderId] ?? [];
    return [...drafts].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  },

  listDraftSummaries(encoderId: string): EncoderDraftSummary[] {
    return this.listDrafts(encoderId).map(toSummary);
  },

  getDraftById(encoderId: string, draftId: string): EncoderDraft | null {
    const drafts = this.listDrafts(encoderId);
    return drafts.find((draft) => draft.id === draftId) ?? null;
  },

  saveDraft(encoderId: string, values: HealthCardFormValues, step: number, draftId?: string): string {
    const draftMap = readDraftMap();
    const currentDrafts = draftMap[encoderId] ?? [];
    const now = new Date().toISOString();
    const id = draftId ?? (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

    const existing = currentDrafts.find((draft) => draft.id === id);
    const nextDraft: EncoderDraft = {
      id,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      step: clampStep(step),
      values,
    };

    const nextDrafts = existing
      ? currentDrafts.map((draft) => (draft.id === id ? nextDraft : draft))
      : [nextDraft, ...currentDrafts];

    draftMap[encoderId] = nextDrafts;
    writeDraftMap(draftMap);
    return id;
  },

  deleteDraft(encoderId: string, draftId: string) {
    const draftMap = readDraftMap();
    const currentDrafts = draftMap[encoderId] ?? [];
    draftMap[encoderId] = currentDrafts.filter((draft) => draft.id !== draftId);
    writeDraftMap(draftMap);
  },

  getStorageUsagePercent(): number {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY) ?? '';
    const usedBytes = new TextEncoder().encode(raw).length;
    return Math.min(100, Math.round((usedBytes / MAX_LOCAL_STORAGE_BYTES) * 100));
  },
};
