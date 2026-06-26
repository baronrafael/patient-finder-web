import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PageShell } from '../../../../shared/components/page-shell/page-shell';

@Component({
  selector: 'app-patient-form-page',
  imports: [PageHeader, PageShell],
  templateUrl: './patient-form-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientFormPage {}
