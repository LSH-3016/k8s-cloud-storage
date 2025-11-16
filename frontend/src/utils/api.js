import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

export const fetchFiles = async (username, path = '/') => {
  const response = await api.get('/files', { params: { user: username, path } });
  return response.data;
};

export const downloadFile = (username, path) => {
  window.open(`${API_URL}/files/download?user=${encodeURIComponent(username)}&path=${encodeURIComponent(path)}`, '_blank');
};

export const uploadFile = async (username, file, path = '/') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);
  formData.append('user', username);

  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteFile = async (username, path) => {
  const response = await api.delete('/files', { params: { user: username, path } });
  return response.data;
};

export const moveFile = async (username, src, dst) => {
  const formData = new FormData();
  formData.append('user', username);
  formData.append('src', src);
  formData.append('dst', dst);
  const response = await api.post('/files/move', formData);
  return response.data;
};

export const copyFile = async (username, src, dst) => {
  const formData = new FormData();
  formData.append('user', username);
  formData.append('src', src);
  formData.append('dst', dst);
  const response = await api.post('/files/copy', formData);
  return response.data;
};

export const renameFile = async (username, oldPath, newName) => {
  const formData = new FormData();
  formData.append('user', username);
  formData.append('oldPath', oldPath);
  formData.append('newName', newName);
  const response = await api.post('/files/rename', formData);
  return response.data;
};

export const createDirectory = async (username, path, name) => {
  const formData = new FormData();
  formData.append('user', username);
  formData.append('path', path);
  formData.append('name', name);
  const response = await api.post('/files/mkdir', formData);
  return response.data;
};

export const getThumbnailUrl = (username, path) => {
  return `${API_URL}/files/thumbnail?user=${encodeURIComponent(username)}&path=${encodeURIComponent(path)}`;
};

export const fetchSystemStats = async () => {
  const response = await api.get('/system/stats');
  return response.data;
};

export default api;
