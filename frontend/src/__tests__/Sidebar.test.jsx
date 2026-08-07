import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User', role: 'User' },
    isAdmin: false,
  }),
}));

describe('Sidebar', () => {
  it('renders without crashing when a navigation item has no explicit icon', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <Sidebar open={false} setOpen={() => {}} darkMode={false} />
      </MemoryRouter>
    );

    expect(markup).toContain('News');
  });
});
