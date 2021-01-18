import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-citation-page',
  templateUrl: './citation-page.component.html',
  styleUrls: ['./citation-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CitationPageComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
