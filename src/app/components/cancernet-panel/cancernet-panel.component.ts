import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Drug } from 'src/app/interfaces';
import { ControlService } from 'src/app/services/control/control.service';

@Component({
  selector: 'app-cancernet-panel',
  templateUrl: './cancernet-panel.component.html',
  styleUrls: ['./cancernet-panel.component.scss']
})
export class CancernetPanelComponent implements OnInit {

  public _drug: Drug | null = null;
  public cancernetData: any[] = [];

  @Input() public show = false;
  @Output() closeEvent: EventEmitter<boolean> = new EventEmitter();

  @Input()
  public set drug(drug: Drug | null) {
    if (drug === null) {
      return 
    }
    this._drug = drug;
    this.load();
  }

  constructor(private control: ControlService) { }

  ngOnInit(): void {
  }

  public close() {
    this.show = false;
    this.closeEvent.emit(this.show)
  }

  public async load() {
    const data = await this.control.cancernetLookup(this._drug);
    this.cancernetData = data.cancernet;
  }

}
