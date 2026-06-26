import { TestBed } from '@angular/core/testing';

import { Estado, Municipio } from '../../models/location.model';
import { PatientSearchFilters } from './patient-search-filters';

const mirandaMunicipios: readonly Municipio[] = [
  {
    id: 'chacao',
    name: 'Chacao',
    parroquias: [{ id: 'chacao', name: 'Chacao' }],
  },
];

const mockEstados: readonly Estado[] = [
  {
    id: 'miranda',
    name: 'Miranda',
    municipios: mirandaMunicipios,
  },
  {
    id: 'carabobo',
    name: 'Carabobo',
    municipios: [
      {
        id: 'valencia',
        name: 'Valencia',
        parroquias: [{ id: 'catedral', name: 'Catedral' }],
      },
    ],
  },
];

describe('PatientSearchFilters', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientSearchFilters],
    }).compileComponents();
  });

  it('keeps municipio and parroquia disabled until their parent is selected', async () => {
    const fixture = TestBed.createComponent(PatientSearchFilters);
    fixture.componentRef.setInput('estados', mockEstados);
    await fixture.whenStable();

    const municipioSelect = fixture.nativeElement.querySelector(
      '#municipio-filter',
    ) as HTMLSelectElement;
    const parroquiaSelect = fixture.nativeElement.querySelector(
      '#parroquia-filter',
    ) as HTMLSelectElement;

    expect(municipioSelect.disabled).toBe(true);
    expect(parroquiaSelect.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Selecciona un estado primero.');
    expect(fixture.nativeElement.textContent).toContain('Selecciona un municipio primero.');
  });

  it('enables municipio after selecting an estado', async () => {
    const fixture = TestBed.createComponent(PatientSearchFilters);
    fixture.componentRef.setInput('estados', mockEstados);
    fixture.componentRef.setInput('municipios', mirandaMunicipios);
    fixture.componentRef.setInput('selectedEstadoId', 'miranda');
    await fixture.whenStable();

    const municipioSelect = fixture.nativeElement.querySelector(
      '#municipio-filter',
    ) as HTMLSelectElement;

    expect(municipioSelect.disabled).toBe(false);
    expect(municipioSelect.textContent).toContain('Chacao');
  });

  it('emits normalized filter values', async () => {
    const fixture = TestBed.createComponent(PatientSearchFilters);
    fixture.componentRef.setInput('estados', mockEstados);
    const emitted: Array<{
      sex: 'm' | 'f' | null;
      estadoId: string | null;
      municipioId: string | null;
      parroquiaId: string | null;
    }> = [];
    fixture.componentRef.instance.filtersChange.subscribe((value) => emitted.push(value));
    await fixture.whenStable();

    fixture.componentInstance.filterModel.set({
      sex: 'm',
      estadoId: '',
      municipioId: '',
      parroquiaId: '',
    });
    await fixture.whenStable();

    expect(emitted).toEqual([
      { sex: 'm', estadoId: null, municipioId: null, parroquiaId: null },
    ]);
  });

  it('emits estado changes', async () => {
    const fixture = TestBed.createComponent(PatientSearchFilters);
    fixture.componentRef.setInput('estados', mockEstados);
    const emitted: Array<{
      sex: 'm' | 'f' | null;
      estadoId: string | null;
      municipioId: string | null;
      parroquiaId: string | null;
    }> = [];
    fixture.componentRef.instance.filtersChange.subscribe((value) => emitted.push(value));
    await fixture.whenStable();

    fixture.componentInstance.filterModel.set({
      sex: '',
      estadoId: 'miranda',
      municipioId: '',
      parroquiaId: '',
    });
    await fixture.whenStable();

    expect(emitted).toEqual([
      { sex: null, estadoId: 'miranda', municipioId: null, parroquiaId: null },
    ]);
  });

  it('clears invalid municipio when estado changes', async () => {
    const fixture = TestBed.createComponent(PatientSearchFilters);
    fixture.componentRef.setInput('estados', mockEstados);
    fixture.componentRef.setInput('municipios', mirandaMunicipios);
    fixture.componentRef.setInput('selectedEstadoId', 'miranda');
    fixture.componentRef.setInput('selectedMunicipioId', 'chacao');
    const emitted: Array<{
      sex: 'm' | 'f' | null;
      estadoId: string | null;
      municipioId: string | null;
      parroquiaId: string | null;
    }> = [];
    fixture.componentRef.instance.filtersChange.subscribe((value) => emitted.push(value));
    await fixture.whenStable();

    fixture.componentInstance.filterModel.set({
      sex: '',
      estadoId: 'carabobo',
      municipioId: 'chacao',
      parroquiaId: '',
    });
    fixture.componentRef.setInput('municipios', mockEstados[1].municipios ?? []);
    await fixture.whenStable();

    expect(fixture.componentInstance.filterModel().municipioId).toBe('');
    expect(emitted).toContainEqual({
      sex: null,
      estadoId: 'carabobo',
      municipioId: null,
      parroquiaId: null,
    });
  });
});
