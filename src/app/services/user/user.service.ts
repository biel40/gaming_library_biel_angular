import { Injectable } from '@angular/core';
import { User } from '@supabase/supabase-js';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    protected user: User | null = null;

    constructor() {
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
            this.user = JSON.parse(storedUser);
        }
    }

    public setUser(user: User | null): void {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    }

    public getUser(): User | null {
        return this.user;
    }

    public clearUser() {
        this.user = null;
        localStorage.removeItem('user');
    }

    public isLoggedIn(): boolean {
        return !!this.user;
    }
}