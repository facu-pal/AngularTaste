import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HighClientPage } from './high-client.page';

describe('HighClientPage', () => {
  let component: HighClientPage;
  let fixture: ComponentFixture<HighClientPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HighClientPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
