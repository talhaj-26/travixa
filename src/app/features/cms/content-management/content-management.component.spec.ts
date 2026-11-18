import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ContentManagementComponent } from './content-management.component';
import { CmsPageService } from '../../../core/services/cms-page.service';

describe('ContentManagementComponent', () => {
  let component: ContentManagementComponent;
  let fixture: ComponentFixture<ContentManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentManagementComponent],
      providers: [{ provide: CmsPageService, useValue: { getAll: () => of([]), getEnabledLanguages: () => of([]) } }],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContentManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
