import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExplorerNetworkInformationComponent } from './explorer-network-information.component';

describe('ExplorerNetworkInformationComponent', () => {
  let component: ExplorerNetworkInformationComponent;
  let fixture: ComponentFixture<ExplorerNetworkInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExplorerNetworkInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorerNetworkInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
