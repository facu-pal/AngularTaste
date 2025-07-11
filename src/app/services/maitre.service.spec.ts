import { TestBed } from '@angular/core/testing';

import { MaitreService } from './maitre.service';

describe('MaitreService', () => {
  let service: MaitreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaitreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
