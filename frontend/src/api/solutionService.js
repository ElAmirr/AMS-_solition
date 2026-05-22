import api from './axios';

export const getJigSolutions = async () => {
    const response = await api.get('/solutions/jig');
    return response.data;
};

export const createJigSolution = async (data) => {
    const response = await api.post('/solutions/jig', data);
    return response.data;
};

export const updateJigSolution = async (id, data) => {
    const response = await api.put(`/solutions/jig/${id}`, data);
    return response.data;
};

export const deleteJigSolution = async (id) => {
    const response = await api.delete(`/solutions/jig/${id}`);
    return response.data;
};

export const getProgramSolutions = async () => {
    const response = await api.get('/solutions/program');
    return response.data;
};

export const createProgramSolution = async (data) => {
    const response = await api.post('/solutions/program', data);
    return response.data;
};

export const updateProgramSolution = async (id, data) => {
    const response = await api.put(`/solutions/program/${id}`, data);
    return response.data;
};

export const deleteProgramSolution = async (id) => {
    const response = await api.delete(`/solutions/program/${id}`);
    return response.data;
};
