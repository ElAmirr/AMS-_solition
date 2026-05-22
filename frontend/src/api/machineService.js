import api from './axios';

export const getMachines = async () => {
    const response = await api.get('/machines');
    return response.data;
};

export const createMachine = async (data) => {
    const response = await api.post('/machines', data);
    return response.data;
};

export const updateMachine = async (id, data) => {
    const response = await api.put(`/machines/${id}`, data);
    return response.data;
};

export const deleteMachine = async (id) => {
    const response = await api.delete(`/machines/${id}`);
    return response.data;
};
