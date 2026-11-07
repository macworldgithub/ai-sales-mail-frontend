export interface EmailContent { subject: string; body: string; closing: string; signatureId?: string | null }
export interface Campaign {
  _id: string;
  campaignName: string;
  description: string;
  status: string;
  scheduledAt?: string | null;
  lastProcessedAt?: string | null;
  lastDeliveryError?: string | null;
  chunkSize?: number | null;
  chunkGapSeconds?: number | null;
  currentChunk?: number;
  nextChunkAt?: string | null;
  canRetryRejected?: boolean;
  smtpHold?: { until: string; reason: string };
  totalEmailSent: number;
  totalEmailOpened: number;
  totalEmailReplied: number;
  isAutomatedReply: boolean;
  hasFollowUp: boolean;
  followUpDuration: number | null;
}
export interface TemplateSummary { _id: string; templateName: string; templatePurpose: string }
export interface ModalProps { visible: boolean; onClose: () => void }
export const openRate = (opened: number, sent: number) => sent > 0 ? Math.min(100, opened / sent * 100) : 0;
