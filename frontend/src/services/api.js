import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

export const getPOs = () => api.get('/pos');
export const createPO = (data) => api.post('/pos', data);
export const deletePO = (id) => api.delete(`/pos/${id}`);
export const submitApproval = (data) => api.post('/approvals', data);
export const getUsers = () => api.get('/users');
export const getPOApprovals = (poId) => api.get(`/pos/${poId}/approvals`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const updateUserSignature = (id, data) => api.patch(`/users/${id}/signature`, data);
export const updateUserPhoto = (id, data) => api.patch(`/users/${id}/photo`, data);

// Admin APIs
export const getPlants = () => api.get('/plants');
export const createPlant = (data) => api.post('/plants', data);
export const deletePlant = (id) => api.delete(`/plants/${id}`);
export const getDepartments = () => api.get('/departments');
export const createDepartment = (data) => api.post('/departments', data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);
export const getAuditLogs = () => api.get('/audit-logs');

export default api;
