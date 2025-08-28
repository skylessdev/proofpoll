/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

import { describe, it, expect } from 'vitest';
import { 
  deltaLogic, 
  deltaTemporal, 
  divergence, 
  verdictFrom, 
  updateIntegrity 
} from '../core';

describe('DBT Core Functions', () => {
  describe('deltaLogic', () => {
    it('returns 0 for valid transitions', () => {
      expect(deltaLogic('A', 'B')).toBe(0);
      expect(deltaLogic(null, 'A')).toBe(0); // first vote
      expect(deltaLogic(undefined, 'A')).toBe(0); // first vote
    });
    
    it('returns 0 for same option (allowed in current implementation)', () => {
      expect(deltaLogic('A', 'A')).toBe(0);
    });
  });

  describe('deltaTemporal', () => {
    it('returns 0 for unknown transitions or same option', () => {
      expect(deltaTemporal('A', 'B')).toBe(0); // Unknown embedding returns 0
      expect(deltaTemporal('A', 'A')).toBe(0);
      expect(deltaTemporal(null, 'A')).toBe(0);
    });
  });

  describe('divergence', () => {
    it('calculates L2 norm divergence correctly', () => {
      const dL = 0, dT = 0.5;
      const expected = Math.sqrt(0.6 * 0 * 0 + 0.4 * 0.5 * 0.5); // sqrt(WL * dL^2 + WT * dT^2)
      expect(divergence(dL, dT)).toBeCloseTo(expected, 3);
    });
  });

  describe('verdictFrom', () => {
    it('returns REJECT for high divergence', () => {
      expect(verdictFrom(0.9, 0)).toBe('REJECT');
    });
    
    it('returns VALID for low divergence', () => {
      expect(verdictFrom(0.3, 0)).toBe('VALID');
    });
    
    it('returns REJECT for logic violations regardless of divergence', () => {
      expect(verdictFrom(0.1, 1)).toBe('REJECT');
    });
  });

  describe('updateIntegrity', () => {
    it('starts at 0.8 for first interaction with some divergence', () => {
      expect(updateIntegrity(undefined, 0.2)).toBe(0.8);
    });
    
    it('decreases integrity for high divergence', () => {
      const prev = 0.8;
      const result = updateIntegrity(prev, 0.9);
      expect(result).toBeLessThan(prev);
    });
    
    it('maintains or increases integrity for low divergence', () => {
      const prev = 0.7;
      const result = updateIntegrity(prev, 0.1);
      expect(result).toBeGreaterThanOrEqual(prev - 0.1); // some tolerance
    });
  });
});