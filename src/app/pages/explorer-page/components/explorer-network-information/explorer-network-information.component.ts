import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-explorer-network-information',
  templateUrl: './explorer-network-information.component.html',
  styleUrls: ['./explorer-network-information.component.scss']
})
export class ExplorerNetworkInformationComponent implements OnInit {

  hidden = false;
  storageKey = `caddie-explorer-network-info-${window.location.host}`

  constructor() { }

  ngOnInit(): void {
    if (localStorage.getItem(this.storageKey) === 'true') {
      this.hidden = true;
    }
  }

  public delete_notification (event) {
    this.hidden = true;
  }

  public delete_notification_forever(event) {
    localStorage.setItem(this.storageKey, 'true');
    this.hidden = true;
  }

}
