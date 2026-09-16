import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getJobs = () => api.get('/jobs');
export const createJob = (payload) => api.post('/jobs', payload);
export const updateJobStatus = (id, status) =>
  api.patch(`/jobs/${id}/status`, { status });
export const deleteJob = (id) => api.delete(`/jobs/${id}`);
