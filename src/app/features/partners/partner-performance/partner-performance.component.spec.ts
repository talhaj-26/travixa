import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnerPerformanceComponent } from './partner-performance.component';

describe('PartnerPerformanceComponent', () => {
  let component: PartnerPerformanceComponent;
  let fixture: ComponentFixture<PartnerPerformanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerPerformanceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PartnerPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
