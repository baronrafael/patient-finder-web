import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PatientListFilters } from './patient-list-filters';

describe('PatientListFilters', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientListFilters],
    }).compileComponents();
  });

  it('shows the submit hint', async () => {
    const fixture = TestBed.createComponent(PatientListFilters);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Pulsa Buscar para aplicar los filtros.');
  });

  it('disables fields and submit when disabled', async () => {
    const fixture = TestBed.createComponent(PatientListFilters);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();

    const searchInput = fixture.nativeElement.querySelector('#patient-list-search') as HTMLInputElement;
    const sexSelect = fixture.nativeElement.querySelector('#patient-list-sex') as HTMLSelectElement;
    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(searchInput.disabled).toBe(true);
    expect(sexSelect.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
  });

  it('emits normalized filters on submit', async () => {
    const fixture = TestBed.createComponent(PatientListFilters);
    const emitted: Array<{ query: string; sex: 'm' | 'f' | null; status: string | null }> = [];
    fixture.componentRef.instance.filtersSubmit.subscribe((value) => emitted.push(value));
    await fixture.whenStable();

    fixture.componentInstance.filterModel.set({
      query: '  Garcia ',
      sex: 'f',
      status: 'hospitalized',
    });
    fixture.nativeElement.querySelector('form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();

    expect(emitted).toEqual([
      { query: '  Garcia ', sex: 'f', status: 'hospitalized' },
    ]);
  });

  it('emits filtersClear when clear button is clicked', async () => {
    const fixture = TestBed.createComponent(PatientListFilters);
    const clearSpy = vi.fn();
    fixture.componentRef.setInput('hasActiveFilters', true);
    fixture.componentRef.instance.filtersClear.subscribe(clearSpy);
    await fixture.whenStable();

    const clearButton = fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement;
    clearButton.click();
    await fixture.whenStable();

    expect(clearSpy).toHaveBeenCalledTimes(1);
  });
});
