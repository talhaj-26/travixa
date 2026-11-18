import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { HotelService } from '../../../core/services/hotel.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { TourPackageService } from '../../../core/services/tour-package.service';
import { ListingApprovalsComponent } from './listing-approvals.component';

describe('ListingApprovalsComponent', () => {
  let component: ListingApprovalsComponent;
  let fixture: ComponentFixture<ListingApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListingApprovalsComponent],
      providers: [
        { provide: HotelService, useValue: { getAdminHotels: () => of([]) } },
        { provide: RestaurantService, useValue: { getAdminRestaurants: () => of([]) } },
        { provide: TourPackageService, useValue: { getAdminPackages: () => of([]) } },
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListingApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
