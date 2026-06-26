import { TestBed } from '@angular/core/testing';

import { PatientRecord } from '../../models/patient-record.model';
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
  it('omits optional fields without content', async () => {
    const fixture = TestBed.createComponent(PatientResultCard);

    fixture.componentRef.setInput('patient', createPatient());
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('GARCÍA MARÍA');
    expect(compiled.textContent).not.toContain('Edad');
    expect(compiled.textContent).not.toContain('Cédula / ID');
    expect(compiled.textContent).toContain('Sin teléfono registrado');
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

  it('reveals secondary details when expanded', async () => {
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
    expect(compiled.textContent).not.toContain('Requiere seguimiento');

    compiled.querySelector<HTMLButtonElement>('.patient-card__details-toggle')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.textContent).toContain('Caracas');
    expect(compiled.textContent).toContain('Requiere seguimiento');
  });
});
