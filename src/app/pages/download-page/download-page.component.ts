import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-download-page',
  templateUrl: './download-page.component.html',
  styleUrls: ['./download-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadPageComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
