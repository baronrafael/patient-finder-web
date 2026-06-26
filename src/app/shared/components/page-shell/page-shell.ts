import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-page-shell',
  template: `<section class="panel panel-padded"><ng-content /></section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageShell {}
