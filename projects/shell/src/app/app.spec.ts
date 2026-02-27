import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { App } from './app';

describe('App (shell)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('should create the shell component', () => {
    // ARRANGE
    const fixture = TestBed.createComponent(App);

    // ASSERT
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the brand name in the header', async () => {
    // ARRANGE
    const fixture = TestBed.createComponent(App);

    // ACT
    await fixture.whenStable();

    // ASSERT
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.shell-brand')?.textContent).toContain('Microfrontend POC');
  });

  it('should render nav links for Customers and Accounts', async () => {
    // ARRANGE
    const fixture = TestBed.createComponent(App);

    // ACT
    await fixture.whenStable();

    // ASSERT
    const anchors = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.shell-nav a'),
    );
    const labels = anchors.map((a) => a.textContent?.trim());
    expect(labels).toContain('Customers');
    expect(labels).toContain('Accounts');
  });

  it('should have a <main> element with router-outlet', async () => {
    // ARRANGE
    const fixture = TestBed.createComponent(App);

    // ACT
    await fixture.whenStable();

    // ASSERT
    const main = (fixture.nativeElement as HTMLElement).querySelector('main.shell-main');
    expect(main).toBeTruthy();
    expect(main?.querySelector('router-outlet')).toBeTruthy();
  });
});
