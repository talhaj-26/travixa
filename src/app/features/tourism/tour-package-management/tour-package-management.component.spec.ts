import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourPackageManagementComponent } from './tour-package-management.component';

describe('TourPackageManagementComponent', () => {
  let component: TourPackageManagementComponent;
  let fixture: ComponentFixture<TourPackageManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourPackageManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TourPackageManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
