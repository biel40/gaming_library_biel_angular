import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

export interface ZombiesBreadcrumbItem {
  label: string;
  link?: string | (string | number)[];
}

@Component({
  selector: 'app-zombies-breadcrumbs',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent implements AfterViewInit, OnDestroy {
  readonly items = input.required<ZombiesBreadcrumbItem[]>();

  private readonly nav = viewChild<ElementRef<HTMLElement>>('nav');
  private resizeObserver?: ResizeObserver;

  // El desvanecido a la derecha (mask-image) solo debe aplicarse cuando la
  // cadena de migas realmente desborda el ancho disponible. Si se aplica
  // siempre en mobile, la última miga (aria-current, en negrita) queda
  // parcialmente transparente aunque quepa entera en pantalla, dando la
  // sensación de que el texto está "cortado".
  readonly isScrollable = signal(false);

  public constructor() {
    effect(() => {
      this.items();
      queueMicrotask(() => this.updateScrollable());
    });
  }

  public ngAfterViewInit(): void {
    const el = this.nav()?.nativeElement;
    if (!el) return;

    this.resizeObserver = new ResizeObserver(() => this.updateScrollable());
    this.resizeObserver.observe(el);
    this.updateScrollable();
  }

  public ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private updateScrollable(): void {
    const el = this.nav()?.nativeElement;
    if (!el) return;
    this.isScrollable.set(el.scrollWidth > el.clientWidth + 1);
  }
}
