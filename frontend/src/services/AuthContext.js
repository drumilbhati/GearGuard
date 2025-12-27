import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user_name');
        const storedRole = localStorage.getItem('user_role');
        const storedId = localStorage.getItem('user_id'); // Load ID
        if (token && storedUser) {
            setUser({ name: storedUser, role: storedRole, id: storedId ? parseInt(storedId) : null, token });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        // Assuming backend returns user_id in the response map or we decode it
        // The backend Login handler returns: { token, name, role } but NOT id.
        // I will fix the backend to return ID as well.
        // For now, let's assume I fix the backend next.
        const { token, name, role, user_id } = res.data; 
        
        localStorage.setItem('token', token);
        localStorage.setItem('user_name', name);
        localStorage.setItem('user_role', role);
        if (user_id) localStorage.setItem('user_id', user_id);
        
        setUser({ name, role, id: user_id, token });
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
