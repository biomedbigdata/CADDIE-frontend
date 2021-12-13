import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkMenuDialogComponent } from './network-menu-dialog.component';

describe('NetworkMenuDialogComponent', () => {
  let component: NetworkMenuDialogComponent;
  let fixture: ComponentFixture<NetworkMenuDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetworkMenuDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkMenuDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
