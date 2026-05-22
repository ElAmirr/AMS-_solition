import axios from './axios';

export const login = async (credentials) => {
    const response = await axios.post('/auth/login', credentials);
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
};

export const saveUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
};
