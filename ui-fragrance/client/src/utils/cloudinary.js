import api from './api.js';

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/reviews/upload', formData);

  return data?.url;
};
