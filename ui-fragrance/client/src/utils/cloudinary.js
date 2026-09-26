export const uploadToCloudinary = async (file, folder = 'ui-fragrance/reviews/photos') => {
  const cloudName = String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
  const uploadPreset = String(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();

  const isPlaceholderValue = (value) => !value || /your_cloud_name|your_unsigned_upload_preset|replace_me|example/i.test(value);

  if (!cloudName || !uploadPreset || isPlaceholderValue(cloudName) || isPlaceholderValue(uploadPreset)) {
    throw new Error('Cloudinary is not configured. Add your real VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET values in the client .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.secure_url) {
    throw new Error(result?.error?.message || 'Cloudinary upload failed.');
  }

  return result.secure_url;
};
