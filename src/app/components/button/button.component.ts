import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {

  @Input() buttonText: string;
  @Input() icon: string;
  @Input() disabled: boolean = false;
  @Output() callbackFun = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
  }

  onClickEventReceived() {
    this.callbackFun.emit();
  }

}
