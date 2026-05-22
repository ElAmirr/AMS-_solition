import api from './axios';

export const saveChecklist = async (data) => {
    // This will return a blob for the Excel file
    const response = await api.post('/checklist/save', data, {
        responseType: 'blob'
    });
    return response.data;
};

export const getChecklists = async () => {
    const response = await api.get('/checklist');
    return response.data;
};
