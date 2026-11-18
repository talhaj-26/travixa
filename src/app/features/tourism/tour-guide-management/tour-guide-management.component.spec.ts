import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourGuideManagementComponent } from './tour-guide-management.component';

describe('TourGuideManagementComponent', () => {
  let component: TourGuideManagementComponent;
  let fixture: ComponentFixture<TourGuideManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourGuideManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TourGuideManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
