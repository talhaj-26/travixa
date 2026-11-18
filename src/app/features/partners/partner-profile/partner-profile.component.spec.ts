import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PartnerProfileComponent } from './partner-profile.component';
import { PartnerMembershipService } from '../../../core/services/partner-membership.service';
import { PartnerOrganizationService } from '../../../core/services/partner-organization.service';

describe('PartnerProfileComponent', () => {
  let component: PartnerProfileComponent;
  let fixture: ComponentFixture<PartnerProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerProfileComponent],
      providers: [
        { provide: PartnerMembershipService, useValue: { getMine: () => of([]) } },
        { provide: PartnerOrganizationService, useValue: { getById: () => of(null) } },
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PartnerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
