import { TestBed } from '@angular/core/testing';

import { PatientRecord } from '../../models/patient-record.model';
import { PATIENT_FIELD_EMPTY_LABELS } from '../../utils/patient-field-display';
import { PatientResultCard } from './patient-result-card';

function createPatient(overrides: Partial<PatientRecord> = {}): PatientRecord {
  return {
    id: '1',
    sourceRow: 1,
    fullName: 'GARCÍA MARÍA',
    age: null,
    identityDocument: null,
    phone: null,
    address: null,
    observations: null,
    hospitalId: 'hospital-a',
    hospitalName: 'Hospital A',
    sourceHospitalName: 'Hospital A',
    ...overrides,
  };
}

describe('PatientResultCard', () => {
  it('shows primary fields with empty placeholders when values are missing', async () => {
    const fixture = TestBed.createComponent(PatientResultCard);

    fixture.componentRef.setInput('patient', createPatient());
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('GARCÍA MARÍA');
    expect(compiled.textContent).toContain('Cédula / ID');
    expect(compiled.textContent).toContain(PATIENT_FIELD_EMPTY_LABELS.identityDocument);
    expect(compiled.textContent).toContain('Edad');
    expect(compiled.textContent).toContain(PATIENT_FIELD_EMPTY_LABELS.age);
    expect(compiled.textContent).toContain('Sin teléfono registrado');
    expect(compiled.textContent).toContain('Ver datos adicionales');
  });

  it('shows contact actions and phone when available', async () => {
    const fixture = TestBed.createComponent(PatientResultCard);

    fixture.componentRef.setInput(
      'patient',
      createPatient({
        phone: '04141234567',
        identityDocument: 'V-28.443.736',
        age: '34',
      }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('04141234567');
    expect(compiled.textContent).toContain('Llamar');
    expect(compiled.textContent).toContain('WhatsApp');
    expect(compiled.textContent).toContain('Copiar');
    expect(compiled.querySelector('.patient-card__avatar')?.textContent).toContain('GM');
  });

  it('reveals secondary details with placeholders when expanded', async () => {
    const fixture = TestBed.createComponent(PatientResultCard);

    fixture.componentRef.setInput('patient', createPatient());
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Dirección / procedencia');

    compiled.querySelector<HTMLButtonElement>('.patient-card__details-toggle')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.textContent).toContain(PATIENT_FIELD_EMPTY_LABELS.address);
    expect(compiled.textContent).toContain(PATIENT_FIELD_EMPTY_LABELS.observations);
  });

  it('highlights observations when present in secondary details', async () => {
    const fixture = TestBed.createComponent(PatientResultCard);

    fixture.componentRef.setInput(
      'patient',
      createPatient({
        address: 'Caracas',
        observations: 'Requiere seguimiento',
      }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.patient-card__details-toggle')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.textContent).toContain('Caracas');
    expect(compiled.textContent).toContain('Requiere seguimiento');
    expect(compiled.querySelector('.patient-card__secondary-item--alert')).toBeTruthy();
  });
});
