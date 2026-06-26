import { TestBed } from '@angular/core/testing';

import { PatientRecord } from '../../models/patient-record.model';
import { PatientResultCard } from './patient-result-card';

describe('PatientResultCard', () => {
  it('omits optional fields without content', async () => {
    const fixture = TestBed.createComponent(PatientResultCard);
    const patient: PatientRecord = {
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
    };

    fixture.componentRef.setInput('patient', patient);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('GARCÍA MARÍA');
    expect(compiled.textContent).not.toContain('Edad');
    expect(compiled.textContent).not.toContain('Cédula / ID');
  });
});
