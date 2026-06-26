import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';

import { buildWhatsAppHref } from '../../../../core/utils/phone-links';
import { PatientRecord } from '../../models/patient-record.model';
import {
  buildPatientContactSummary,
  buildPatientShareSummary,
} from '../../utils/build-patient-contact-summary';
import { getPatientInitials } from '../../utils/patient-card.presenter';
import { PATIENT_FIELD_EMPTY_LABELS, hasPatientFieldValue } from '../../utils/patient-field-display';
import { PATIENT_SEARCH_MESSAGES } from '../../utils/patient-search.messages';
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

  readonly detailsExpanded = signal(false);

  readonly initials = computed(() => getPatientInitials(this.patient().fullName));

  readonly showsSourceHospitalLabel = computed(() => {
    const patient = this.patient();
    const source = patient.sourceHospitalName?.trim();
    const canonical = patient.hospitalName?.trim();
    return Boolean(source && canonical && source !== canonical);
  });

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

  readonly hasContact = computed(() => hasPatientFieldValue(this.patient().phone));

  readonly hasIdentityDocument = computed(() => hasPatientFieldValue(this.patient().identityDocument));

  readonly hasAge = computed(() => hasPatientFieldValue(this.patient().age));

  readonly hasAddress = computed(() => hasPatientFieldValue(this.patient().address));

  readonly hasObservations = computed(() => hasPatientFieldValue(this.patient().observations));

  readonly hasSecondaryContent = computed(() => this.hasAddress() || this.hasObservations());

  readonly emptyLabels = PATIENT_FIELD_EMPTY_LABELS;
  readonly noAdditionalDetailsLabel = PATIENT_SEARCH_MESSAGES.noAdditionalDetails;

  readonly canShare = computed(
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
  );

  readonly copyFeedback = signal<string | null>(null);

  readonly callAriaLabel = computed(() => `Llamar a ${this.patient().fullName}`);

  readonly whatsAppAriaLabel = computed(() => `Enviar WhatsApp a ${this.patient().fullName}`);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyFeedbackTimer !== null) {
        clearTimeout(this.copyFeedbackTimer);
      }
    });
  }

  toggleDetails(): void {
    this.detailsExpanded.update((expanded) => !expanded);
  }

  async copyIdentityDocument(): Promise<void> {
    const document = this.patient().identityDocument;
    if (!document) {
      return;
    }

    await this.copyText(document, 'Cédula copiada');
  }

  async copyContactDetails(): Promise<void> {
    await this.copyText(buildPatientContactSummary(this.patient()), 'Datos copiados');
  }

  async shareContactDetails(): Promise<void> {
    const patient = this.patient();
    const text = buildPatientShareSummary(patient);

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
    }, 2500);
  }
}
