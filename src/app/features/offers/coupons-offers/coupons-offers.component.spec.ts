import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CouponsOffersComponent } from './coupons-offers.component';

describe('CouponsOffersComponent', () => {
  let component: CouponsOffersComponent;
  let fixture: ComponentFixture<CouponsOffersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CouponsOffersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CouponsOffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
