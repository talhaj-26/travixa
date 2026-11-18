import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaqKnowledgeBaseComponent } from './faq-knowledge-base.component';

describe('FaqKnowledgeBaseComponent', () => {
  let component: FaqKnowledgeBaseComponent;
  let fixture: ComponentFixture<FaqKnowledgeBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqKnowledgeBaseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FaqKnowledgeBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
