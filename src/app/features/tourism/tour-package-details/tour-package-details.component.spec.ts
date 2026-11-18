import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourPackageDetailsComponent } from './tour-package-details.component';

describe('TourPackageDetailsComponent', () => {
  let component: TourPackageDetailsComponent;
  let fixture: ComponentFixture<TourPackageDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourPackageDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TourPackageDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
