import { TestBed } from '@angular/core/testing';

import { NotificationSenderService } from './notification-sender.service';

describe('NotificationSenderService', () => {
  let service: NotificationSenderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationSenderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
