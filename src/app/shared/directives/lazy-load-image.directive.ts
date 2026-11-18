import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, Renderer2, inject } from '@angular/core';

@Directive({ selector: 'img[appLazyLoadImage]', standalone: true })
export class LazyLoadImageDirective implements AfterViewInit, OnDestroy {
  @Input('appLazyLoadImage') src = '';
  @Input() fallbackSrc = 'assets/images/placeholder-travel.svg';
  private readonly image = inject(ElementRef<HTMLImageElement>);
  private readonly renderer = inject(Renderer2);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.renderer.setAttribute(this.image.nativeElement, 'loading', 'lazy');
    this.renderer.listen(this.image.nativeElement, 'error', () => this.renderer.setAttribute(this.image.nativeElement, 'src', this.fallbackSrc));
    if (!('IntersectionObserver' in window)) { this.load(); return; }
    this.observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { this.load(); this.observer?.disconnect(); } }, { rootMargin: '160px' });
    this.observer.observe(this.image.nativeElement);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }
  private load(): void { if (this.src) this.renderer.setAttribute(this.image.nativeElement, 'src', this.src); }
}
