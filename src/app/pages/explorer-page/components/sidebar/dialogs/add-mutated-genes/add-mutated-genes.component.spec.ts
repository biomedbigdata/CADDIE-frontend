import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMutatedGenesComponent } from './add-mutated-genes.component';

describe('AddMutatedGenesComponent', () => {
  let component: AddMutatedGenesComponent;
  let fixture: ComponentFixture<AddMutatedGenesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddMutatedGenesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMutatedGenesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
