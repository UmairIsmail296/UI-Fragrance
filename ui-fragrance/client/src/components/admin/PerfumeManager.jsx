import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api.js';

const MAX_PHOTOS = 5;
const MAX_VIDEOS = 2;

const emptyForm = {
  name: '',
  brand: '',
  actualPrice: '',
  discountPrice: '',
  size: '',
  description: '',
  topNotes: '',
  middleNotes: '',
  baseNotes: '',
};

const resolveUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return path;
};

const PerfumeManager = () => {
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [existingPhotos, setExistingPhotos] = useState([]);
  const [removedPhotos, setRemovedPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);

  const [existingVideos, setExistingVideos] = useState([]);
  const [removedVideos, setRemovedVideos] = useState([]);
  const [newVideos, setNewVideos] = useState([]);

  const fetchPerfumes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/perfumes');
      setPerfumes(data);
    } catch (error) {
      toast.error('Failed to load perfumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerfumes();
  }, []);

  const revokeAllPreviews = () => {
    newPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    newVideos.forEach((v) => URL.revokeObjectURL(v.previewUrl));
  };

  const resetForm = () => {
    revokeAllPreviews();
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setExistingPhotos([]);
    setRemovedPhotos([]);
    setNewPhotos([]);
    setExistingVideos([]);
    setRemovedVideos([]);
    setNewVideos([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (perfume) => {
    revokeAllPreviews();
    setForm({
      name: perfume.name,
      brand: perfume.brand,
      actualPrice: perfume.actualPrice,
      discountPrice: perfume.discountPrice,
      size: perfume.size,
      description: perfume.description,
      topNotes: perfume.topNotes,
      middleNotes: perfume.middleNotes,
      baseNotes: perfume.baseNotes,
    });
    setEditingId(perfume._id);
    setExistingPhotos(perfume.photos || []);
    setRemovedPhotos([]);
    setNewPhotos([]);
    setExistingVideos(perfume.videos || []);
    setRemovedVideos([]);
    setNewVideos([]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this perfume?')) return;
    try {
      await api.delete(`/perfumes/${id}`);
      toast.success('Perfume deleted');
      fetchPerfumes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete perfume');
    }
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';

    const currentTotal = existingPhotos.length + newPhotos.length;
    const remainingSlots = MAX_PHOTOS - currentTotal;

    if (remainingSlots <= 0) {
      toast.error('Maximum 5 photos allowed.');
      return;
    }

    if (files.length > remainingSlots) {
      toast.error('Maximum 5 photos allowed.');
    }

    const accepted = files.slice(0, remainingSlots);
    const withPreviews = accepted.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setNewPhotos((prev) => [...prev, ...withPreviews]);
  };

  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';

    const currentTotal = existingVideos.length + newVideos.length;
    const remainingSlots = MAX_VIDEOS - currentTotal;

    if (remainingSlots <= 0) {
      toast.error('Maximum 2 videos allowed.');
      return;
    }

    if (files.length > remainingSlots) {
      toast.error('Maximum 2 videos allowed.');
    }

    const accepted = files.slice(0, remainingSlots);
    const withPreviews = accepted.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setNewVideos((prev) => [...prev, ...withPreviews]);
  };

  const removeExistingPhoto = (path) => {
    setExistingPhotos((prev) => prev.filter((p) => p !== path));
    setRemovedPhotos((prev) => [...prev, path]);
  };

  const removeNewPhoto = (previewUrl) => {
    setNewPhotos((prev) => {
      const target = prev.find((p) => p.previewUrl === previewUrl);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.previewUrl !== previewUrl);
    });
  };

  const removeExistingVideo = (path) => {
    setExistingVideos((prev) => prev.filter((v) => v !== path));
    setRemovedVideos((prev) => [...prev, path]);
  };

  const removeNewVideo = (previewUrl) => {
    setNewVideos((prev) => {
      const target = prev.find((v) => v.previewUrl === previewUrl);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((v) => v.previewUrl !== previewUrl);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = ['name', 'brand', 'size', 'description', 'topNotes', 'middleNotes', 'baseNotes'];
    for (const field of requiredFields) {
      if (!form[field].trim()) {
        toast.error('Please fill in all fields');
        return;
      }
    }

    // FIXED: dedicated numeric validation for the two price fields
    const actualPriceNum = Number(form.actualPrice);
    const discountPriceNum = Number(form.discountPrice);
    if (
      form.actualPrice === '' ||
      form.discountPrice === '' ||
      Number.isNaN(actualPriceNum) ||
      Number.isNaN(discountPriceNum) ||
      actualPriceNum <= 0 ||
      discountPriceNum <= 0
    ) {
      toast.error('Please enter valid Actual Price and Discount Price values');
      return;
    }

    const totalPhotos = existingPhotos.length + newPhotos.length;
    if (totalPhotos < 1) {
      toast.error('Please upload at least 1 photo');
      return;
    }
    if (totalPhotos > MAX_PHOTOS) {
      toast.error('Maximum 5 photos allowed.');
      return;
    }
    if (existingVideos.length + newVideos.length > MAX_VIDEOS) {
      toast.error('Maximum 2 videos allowed.');
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    newPhotos.forEach((p) => formData.append('photos', p.file));
    newVideos.forEach((v) => formData.append('videos', v.file));
    if (editingId) {
      formData.append('removedPhotos', JSON.stringify(removedPhotos));
      formData.append('removedVideos', JSON.stringify(removedVideos));
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/perfumes/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Perfume updated successfully');
      } else {
        await api.post('/perfumes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Perfume added successfully');
      }
      resetForm();
      fetchPerfumes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const combinedPhotoCount = existingPhotos.length + newPhotos.length;
  const combinedVideoCount = existingVideos.length + newVideos.length;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Perfume Management</h2>
        <button
          className="btn-gold"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? 'Cancel' : '+ Add New Perfume'}
        </button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="form-group">
              <label>Name *</label>
              <input name="name" value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Brand *</label>
              <input name="brand" value={form.brand} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Actual Price (Rs.) *</label>
              <input
                name="actualPrice"
                type="number"
                min="0"
                step="1"
                value={form.actualPrice}
                onChange={handleChange}
                placeholder="8000"
              />
            </div>
            <div className="form-group">
              <label>Discount Price (Rs.) *</label>
              <input
                name="discountPrice"
                type="number"
                min="0"
                step="1"
                value={form.discountPrice}
                onChange={handleChange}
                placeholder="4500"
              />
            </div>
            <div className="form-group">
              <label>Size *</label>
              <input name="size" value={form.size} onChange={handleChange} placeholder="100ml" />
            </div>
            <div className="form-group admin-form-full">
              <label>Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
            </div>
            <div className="form-group">
              <label>Top Notes *</label>
              <input name="topNotes" value={form.topNotes} onChange={handleChange} placeholder="Bergamot, Saffron" />
            </div>
            <div className="form-group">
              <label>Middle Notes *</label>
              <input name="middleNotes" value={form.middleNotes} onChange={handleChange} placeholder="Rose, Oud Wood" />
            </div>
            <div className="form-group">
              <label>Base Notes *</label>
              <input name="baseNotes" value={form.baseNotes} onChange={handleChange} placeholder="Amber, Musk, Sandalwood" />
            </div>

            <div className="form-group admin-form-full">
              <label>Photos * ({combinedPhotoCount}/{MAX_PHOTOS})</label>
              <div className="media-upload-zone">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoSelect}
                  disabled={combinedPhotoCount >= MAX_PHOTOS}
                  id="photo-upload-input"
                />
                <label htmlFor="photo-upload-input" className="media-upload-label">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                    <path d="M19 13v6H5v-6H3v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6h-2zM11 5.83 8.41 8.41 7 7l5-5 5 5-1.41 1.41L13 5.83V15h-2V5.83z" />
                  </svg>
                  <span>Click to upload photos (JPG, PNG, WEBP) — up to 5</span>
                </label>
              </div>

              {combinedPhotoCount > 0 && (
                <div className="media-preview-grid">
                  {existingPhotos.map((path, index) => (
                    <div className="media-preview-thumb" key={path}>
                      {index === 0 && <span className="media-main-badge">Main</span>}
                      <img src={resolveUrl(path)} alt={`Photo ${index + 1}`} />
                      <button type="button" onClick={() => removeExistingPhoto(path)} aria-label="Remove photo">
                        &times;
                      </button>
                    </div>
                  ))}
                  {newPhotos.map((p, index) => (
                    <div className="media-preview-thumb" key={p.previewUrl}>
                      {existingPhotos.length === 0 && index === 0 && (
                        <span className="media-main-badge">Main</span>
                      )}
                      <img src={p.previewUrl} alt={`New photo ${index + 1}`} />
                      <button type="button" onClick={() => removeNewPhoto(p.previewUrl)} aria-label="Remove photo">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group admin-form-full">
              <label>Videos ({combinedVideoCount}/{MAX_VIDEOS}, optional)</label>
              <div className="media-upload-zone">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  multiple
                  onChange={handleVideoSelect}
                  disabled={combinedVideoCount >= MAX_VIDEOS}
                  id="video-upload-input"
                />
                <label htmlFor="video-upload-input" className="media-upload-label">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                    <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                  <span>Click to upload videos (MP4, MOV, WEBM) — up to 2</span>
                </label>
              </div>

              {combinedVideoCount > 0 && (
                <div className="media-preview-grid">
                  {existingVideos.map((path) => (
                    <div className="media-preview-thumb media-preview-video" key={path}>
                      <video src={resolveUrl(path)} muted />
                      <button type="button" onClick={() => removeExistingVideo(path)} aria-label="Remove video">
                        &times;
                      </button>
                    </div>
                  ))}
                  {newVideos.map((v) => (
                    <div className="media-preview-thumb media-preview-video" key={v.previewUrl}>
                      <video src={v.previewUrl} muted />
                      <button type="button" onClick={() => removeNewVideo(v.previewUrl)} aria-label="Remove video">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn-gold" disabled={submitting}>
            {submitting ? <span className="spinner small"></span> : editingId ? 'Update Perfume' : 'Add Perfume'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Actual Price</th>
                <th>Discount Price</th>
                <th>Size</th>
                <th>Media</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {perfumes.map((perfume) => (
                <tr key={perfume._id}>
                  <td>
                    <img
                      className="admin-table-img"
                      src={resolveUrl(perfume.photos?.[0])}
                      alt={perfume.name}
                    />
                  </td>
                  <td>{perfume.name}</td>
                  <td>{perfume.brand}</td>
                  <td>Rs. {Number(perfume.actualPrice).toLocaleString('en-PK')}</td>
                  <td>Rs. {Number(perfume.discountPrice).toLocaleString('en-PK')}</td>
                  <td>{perfume.size}</td>
                  <td>
                    {perfume.photos?.length || 0} photo{perfume.photos?.length === 1 ? '' : 's'}
                    {perfume.videos?.length ? `, ${perfume.videos.length} video${perfume.videos.length === 1 ? '' : 's'}` : ''}
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="btn-outline small" onClick={() => handleEditClick(perfume)}>
                        Edit
                      </button>
                      <button className="btn-danger small" onClick={() => handleDelete(perfume._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {perfumes.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center">No perfumes added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PerfumeManager;