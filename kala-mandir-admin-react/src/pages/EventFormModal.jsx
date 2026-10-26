import { useEffect, useRef, useState } from "react";
import Modal from "../components/Modal";

export default function EventFormModal({ open, onClose, onSave, editing, categories }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("photo");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title || "");
    setDescription(editing?.description || "");
    setCategoryId(editing?.categoryId?._id || editing?.categoryId || categories[0]?.id || "");
    setType(editing?.type || "photo");
    setFile(null);
    setPreviewUrl(editing?.thumbnailUrl || editing?.url || "");
    setUploadProgress(null);
    setError("");
  }, [open, editing, categories]);

  useEffect(() => {
    if (!file) return undefined;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    const expectedType = type === "photo" ? "image/" : "video/";
    if (!selectedFile.type.startsWith(expectedType)) {
      setError(`Choose a ${type === "photo" ? "photo/image" : "video"} file.`);
      return;
    }
    setFile(selectedFile);
    setError("");
  };

  const handleSave = async () => {
    if (!title.trim()) return setError("Please enter an event title.");
    if (!description.trim()) return setError("Please enter an event description.");
    if (!categoryId) return setError("Please select an event category.");
    if (!editing && !file) return setError(`Please select an event ${type}.`);
    if (editing && type !== editing.type && !file) {
      return setError("Select a new file when changing the media type.");
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("categoryId", categoryId);
    formData.append("type", type);
    if (file) formData.append("file", file);
    setSaving(true);
    setError("");
    try {
      setUploadProgress(0);
      await onSave(formData, editing?.id, setUploadProgress);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Event" : "Add Event"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? `Uploading... ${uploadProgress ?? 0}%` : editing ? "Save Changes" : "Publish Event"}
          </button>
        </>
      }
    >
      {error && <div className="error-banner" role="alert">{error}</div>}
      {saving && uploadProgress !== null && (
        <div className="upload-progress" role="status" aria-live="polite">
          <div className="upload-progress-heading">
            <span>Uploading event {type}...</span>
            <strong>{uploadProgress}%</strong>
          </div>
          <progress value={uploadProgress} max="100" aria-label="Event file upload progress" />
        </div>
      )}
      <div className="field-group">
        <label htmlFor="event-title">Event Title</label>
        <input
          className="field"
          id="event-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Annual Dance Showcase"
          required
        />
      </div>
      <div className="field-group">
        <label htmlFor="event-description">Description</label>
        <textarea
          className="field"
          id="event-description"
          rows="5"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Tell visitors about this event..."
          required
        />
      </div>
      <div className="field-group">
        <label htmlFor="event-category">Event Category</label>
        <select
          className="field"
          id="event-category"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          required
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>
      <div className="field-group">
        <label htmlFor="event-media-type">Upload type</label>
        <select
          className="field"
          id="event-media-type"
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setFile(null);
            setPreviewUrl(editing?.thumbnailUrl || editing?.url || "");
            setError("");
          }}
        >
          <option value="photo">Photo (ImageKit)</option>
          <option value="video">Video (Cloudinary unsigned preset)</option>
        </select>
      </div>
      <div className="field-group">
        <label>Event Photo or Video</label>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => fileRef.current?.click()}
          disabled={saving}
        >
          {file ? file.name : editing ? "Choose replacement file (optional)" : `Choose ${type}`}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={type === "photo" ? "image/*" : "video/*"}
          hidden
          onChange={(event) => {
            handleFile(event.target.files[0]);
            event.target.value = "";
          }}
        />
        {editing && !file && <small>Leave empty to keep the current event media.</small>}
      </div>
      {previewUrl && (
        <div style={{ marginBottom: 16, borderRadius: 10, overflow: "hidden", maxHeight: 240 }}>
          {type === "video" ? (
            <video src={file ? previewUrl : editing?.url || previewUrl} poster={file ? undefined : editing?.thumbnailUrl} controls style={{ width: "100%", maxHeight: 240 }} />
          ) : (
            <img src={previewUrl} alt="Event preview" style={{ width: "100%", maxHeight: 240, objectFit: "cover" }} />
          )}
        </div>
      )}
    </Modal>
  );
}
