import api from './axios';

export const getJigs = async () => {
    const response = await api.get('/jigs');
    return response.data;
};

export const createJig = async (data) => {
    const response = await api.post('/jigs', data);
    return response.data;
};

export const updateJig = async (id, data) => {
    const response = await api.put(`/jigs/${id}`, data);
    return response.data;
};

export const deleteJig = async (id) => {
    const response = await api.delete(`/jigs/${id}`);
    return response.data;
};
