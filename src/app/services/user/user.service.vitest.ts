import { describe, expect, it } from 'vitest';

import { UserService } from './user.service';

describe('UserService', () => {
  it('loads user from localStorage on construction', () => {
    const storedUser = { id: 'u1', email: 'a@b.com' };
    localStorage.setItem('user', JSON.stringify(storedUser));

    const service = new UserService();
    expect(service.getUser()).toEqual(storedUser);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('setUser persists user and isLoggedIn reflects state', () => {
    const service = new UserService();
    expect(service.isLoggedIn()).toBe(false);

    const user = { id: 'u2', email: 'x@y.com' };
    service.setUser(user as any);
    expect(JSON.parse(localStorage.getItem('user') || 'null')).toEqual(user);
    expect(service.getUser()).toEqual(user);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('clearUser removes user from memory and localStorage', () => {
    const service = new UserService();
    service.setUser({ id: 'u3', email: 'z@y.com' } as any);
    service.clearUser();
    expect(service.getUser()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
