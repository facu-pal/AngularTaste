import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientApprovalPage } from './client-approval.page';

describe('ClientApprovalPage', () => {
  let component: ClientApprovalPage;
  let fixture: ComponentFixture<ClientApprovalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientApprovalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
