import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Consent from './Consent.jsx';

describe('consent', () => {
  beforeEach(() => localStorage.clear());
  it('shows once, then stays closed after acceptance', () => {
    const { unmount } = render(<Consent/>);
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByText('Понятно, продолжить'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem('htc_consent_v1')).toBeTruthy();
    unmount();
    render(<Consent/>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
