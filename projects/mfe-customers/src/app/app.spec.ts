import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { App } from './app';

describe('App (mfe-customers)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('should create the mfe-customers app component', () => {
    // ARRANGE
    const fixture = TestBed.createComponent(App);

    // ASSERT
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a router-outlet', async () => {
    // ARRANGE
    const fixture = TestBed.createComponent(App);

    // ACT
    await fixture.whenStable();

    // ASSERT
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });
});
