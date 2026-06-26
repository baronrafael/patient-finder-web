import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { highlightSearchText } from '../../utils/highlight-search-text';

@Component({
  selector: 'app-highlight-text',
  templateUrl: './highlight-text.html',
  styleUrl: './highlight-text.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightText {
  readonly text = input.required<string>();
  readonly query = input('');

  readonly segments = computed(() => highlightSearchText(this.text(), this.query()));
}
