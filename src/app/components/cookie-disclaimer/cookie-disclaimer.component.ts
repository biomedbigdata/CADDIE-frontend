import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-cookie-disclaimer',
  templateUrl: './cookie-disclaimer.component.html',
  styleUrls: ['./cookie-disclaimer.component.scss']
})
export class CookieDisclaimerComponent implements OnInit {

  constructor() { }

  public accepted = false;
  private storageKey = `caddie-data-disclaimer-${window.location.host}`;

  ngOnInit(): void {
    if (localStorage.getItem(this.storageKey) === 'true') {
      this.accepted = true;
    }
  }

  public accept() {
    localStorage.setItem(this.storageKey, 'true');
    this.accepted = true;
  }

  public informationLink() {
    window.location.href = "/about#data-privacy-disclaimer"
  }

}
