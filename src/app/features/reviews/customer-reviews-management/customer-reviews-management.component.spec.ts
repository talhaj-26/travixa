import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerReviewsManagementComponent } from './customer-reviews-management.component';

describe('CustomerReviewsManagementComponent', () => {
  let component: CustomerReviewsManagementComponent;
  let fixture: ComponentFixture<CustomerReviewsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerReviewsManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomerReviewsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
