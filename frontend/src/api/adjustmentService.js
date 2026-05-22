import api from './axios';

export const getAdjustments = async (status = '') => {
    const response = await api.get(`/adjustments${status ? `?status=${status}` : ''}`);
    return response.data;
};

export const createAdjustment = async (data) => {
    const response = await api.post('/adjustments', data);
    return response.data;
};

export const updateAdjustmentStatus = async (id, data) => {
    const response = await api.patch(`/adjustments/${id}/status`, data);
    return response.data;
};

export const deleteAdjustment = async (id) => {
    const response = await api.delete(`/adjustments/${id}`);
    return response.data;
};
