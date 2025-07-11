import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientSurveyPage } from './client-survey.page';

describe('ClientSurveyPage', () => {
  let component: ClientSurveyPage;
  let fixture: ComponentFixture<ClientSurveyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientSurveyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
