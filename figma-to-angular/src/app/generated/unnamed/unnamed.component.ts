import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
@Component({
  selector: 'gen-unnamed',
  standalone: true,
  templateUrl: './unnamed.component.html',
  styleUrls: ['./unnamed.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnnamedComponent {
  @Input() data?: any;
}
