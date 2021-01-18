import {Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy} from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent implements OnInit {

  @Input() buttonText: string;
  @Input() icon: string;
  @Input() disabled = false;
  @Output() callbackFun = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
  }

  onClickEventReceived() {
    this.callbackFun.emit();
  }

}
