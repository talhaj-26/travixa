import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourGuideDetailsComponent } from './tour-guide-details.component';

describe('TourGuideDetailsComponent', () => {
  let component: TourGuideDetailsComponent;
  let fixture: ComponentFixture<TourGuideDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourGuideDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TourGuideDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
