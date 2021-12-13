import { TestBed } from '@angular/core/testing';

import { ExplorerDataService } from './explorer-data.service';

describe('ExplorerDataService', () => {
  let service: ExplorerDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExplorerDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
