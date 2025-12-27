import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user_name');
        if (token && storedUser) {
            setUser({ name: storedUser, token });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        const { token, name, role } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user_name', name);
        localStorage.setItem('user_role', role);
        setUser({ name, role, token });
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_role');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
