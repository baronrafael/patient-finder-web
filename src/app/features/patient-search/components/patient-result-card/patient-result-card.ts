import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';

import { buildWhatsAppHref } from '../../../../core/utils/phone-links';
import { PatientRecord } from '../../models/patient-record.model';
import { isExactDocumentMatch } from '../../utils/patient-search.matcher';
import { HighlightText } from '../highlight-text/highlight-text';

@Component({
  selector: 'app-patient-result-card',
  imports: [HighlightText],
  templateUrl: './patient-result-card.html',
  styleUrl: './patient-result-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientResultCard {
  private readonly destroyRef = inject(DestroyRef);
  private copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

  readonly patient = input.required<PatientRecord>();
  readonly query = input('');

  readonly phoneHref = computed(() => {
    const phone = this.patient().phone;
    if (!phone) {
      return null;
    }

    const normalized = phone.replace(/[^\d+]/g, '');
    return normalized.length > 0 ? `tel:${normalized}` : null;
  });

  readonly whatsAppHref = computed(() => {
    const phone = this.patient().phone;
    return phone ? buildWhatsAppHref(phone) : null;
  });

  readonly isExactDocumentMatch = computed(() => isExactDocumentMatch(this.patient(), this.query()));

  readonly canShare = computed(
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
  );

  readonly copyFeedback = signal<string | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyFeedbackTimer !== null) {
        clearTimeout(this.copyFeedbackTimer);
      }
    });
  }

  async copyIdentityDocument(): Promise<void> {
    const document = this.patient().identityDocument;
    if (!document) {
      return;
    }

    await this.copyText(document, 'Cédula copiada');
  }

  async copyContactDetails(): Promise<void> {
    const patient = this.patient();
    const lines = [
      patient.fullName,
      patient.hospitalName,
      patient.identityDocument ? `Cédula: ${patient.identityDocument}` : null,
      patient.phone ? `Teléfono: ${patient.phone}` : null,
      patient.address ? `Dirección: ${patient.address}` : null,
    ].filter((line): line is string => Boolean(line));

    await this.copyText(lines.join('\n'), 'Datos copiados');
  }

  async shareContactDetails(): Promise<void> {
    const patient = this.patient();
    const text = [
      patient.fullName,
      patient.hospitalName,
      patient.identityDocument ? `Cédula: ${patient.identityDocument}` : null,
      patient.phone ? `Teléfono: ${patient.phone}` : null,
    ]
      .filter((line): line is string => Boolean(line))
      .join('\n');

    if (!this.canShare()) {
      await this.copyText(text, 'Datos copiados');
      return;
    }

    try {
      await navigator.share({
        title: patient.fullName,
        text,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      await this.copyText(text, 'Datos copiados');
    }
  }

  private async copyText(value: string, feedback: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.showCopyFeedback(feedback);
    } catch {
      this.showCopyFeedback('No se pudo copiar');
    }
  }

  private showCopyFeedback(message: string): void {
    if (this.copyFeedbackTimer !== null) {
      clearTimeout(this.copyFeedbackTimer);
    }

    this.copyFeedback.set(message);
    this.copyFeedbackTimer = setTimeout(() => {
      this.copyFeedback.set(null);
      this.copyFeedbackTimer = null;
    }, 2000);
  }
}
