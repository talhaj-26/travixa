import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnerListingsComponent } from './partner-listings.component';

describe('PartnerListingsComponent', () => {
  let component: PartnerListingsComponent;
  let fixture: ComponentFixture<PartnerListingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerListingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PartnerListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
