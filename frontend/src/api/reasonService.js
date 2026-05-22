import axios from './axios';

export const getReasons = async () => {
    const response = await axios.get('/reasons');
    return response.data;
};

export const createReason = async (data) => {
    const response = await axios.post('/reasons', data);
    return response.data;
};

export const updateReason = async (id, data) => {
    const response = await axios.put(`/reasons/${id}`, data);
    return response.data;
};

export const deleteReason = async (id) => {
    const response = await axios.delete(`/reasons/${id}`);
    return response.data;
};
