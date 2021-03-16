import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VcfInputComponent } from './vcf-input.component';

describe('VcfInputComponent', () => {
  let component: VcfInputComponent;
  let fixture: ComponentFixture<VcfInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VcfInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VcfInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
