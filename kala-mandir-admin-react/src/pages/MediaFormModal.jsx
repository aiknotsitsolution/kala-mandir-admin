import { useState, useEffect, useRef } from "react";
import Modal from "../components/Modal";

export default function MediaFormModal({ open, onClose, onSave, editing, categories }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("photo");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const zoneRef = useRef(null);

  const currentCategory = categories.find((category) => category.id === categoryId);
  const subcategories = currentCategory?.subcategories || [];

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title || "");
    setType(editing?.type || "photo");
    setCategoryId(editing?.categoryId || "");
    setSubcategory(editing?.subcategory || "");
    setFile(null);
    setPreviewUrl(editing?.thumb || "");
    setError("");
    setUploadProgress(null);
  }, [open, editing]);

  useEffect(() => {
    if (!categories.some((category) => category.id === categoryId)) {
      setCategoryId(categories[0]?.id || "");
      setSubcategory("");
    }
  }, [categoryId, categories]);

  useEffect(() => {
    if (!file) return undefined;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    const expectedPrefix = type === "photo" ? "image/" : "video/";
    if (!selectedFile.type.startsWith(expectedPrefix)) {
      setError(`Choose a ${type === "photo" ? "photo/image" : "video"} file for this media type.`);
      return;
    }
    setError("");
    setFile(selectedFile);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!title.trim()) return setError("Please enter a title.");
    if (!categoryId) return setError("Please create and select a matching category first.");
    if (!editing && !file) return setError(`Please select a ${type === "photo" ? "photo" : "video"} to upload.`);
    if (editing && type !== editing.type && !file) {
      return setError("Select a new file when changing the media type.");
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("type", type);
    formData.append("categoryId", categoryId);
    formData.append("subcategory", subcategory);
    if (file) formData.append("file", file);
    setSaving(true);
    setError("");
    try {
      setUploadProgress(0);
      await onSave(formData, editing?.id, setUploadProgress);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    zoneRef.current?.classList.remove("dragover");
    handleFile(event.dataTransfer.files[0]);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Media" : "Add Media"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? uploadProgress === 100
                ? "Finishing upload..."
                : `Uploading... ${uploadProgress ?? 0}%`
              : editing
                ? "Save Changes"
                : "Upload Media"}
          </button>
        </>
      }
    >
      {error && <div className="error-banner" role="alert">{error}</div>}
      {saving && uploadProgress !== null && (
        <div className="upload-progress" role="status" aria-live="polite">
          <div className="upload-progress-heading">
            <span>{uploadProgress === 100 ? "File sent; processing upload..." : "Uploading file..."}</span>
            <strong>{uploadProgress}%</strong>
          </div>
          <progress value={uploadProgress} max="100" aria-label="File upload progress" />
          {uploadProgress === 100 && (
            <small>
              Waiting for {type === "photo" ? "ImageKit" : "Cloudinary"} to finish processing and save the media.
            </small>
          )}
        </div>
      )}
      <div className="field-group">
        <label htmlFor="media-type">Media type</label>
        <select
          className="field"
          id="media-type"
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setFile(null);
            setPreviewUrl("");
            setError("");
          }}
        >
          <option value="photo">Photo (ImageKit)</option>
          <option value="video">Video (Cloudinary)</option>
        </select>
      </div>
      <div className="field-group">
        <label htmlFor="media-title">Title</label>
        <input
          className="field"
          id="media-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Kathak Performance"
          required
        />
      </div>
      <div
        className="upload-zone"
        ref={zoneRef}
        onClick={() => fileRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          zoneRef.current?.classList.add("dragover");
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => zoneRef.current?.classList.remove("dragover")}
        onDrop={onDrop}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        <p><strong>{file ? file.name : `Choose ${type === "photo" ? "photo" : "video"}`}</strong> or drag & drop</p>
        <p style={{ fontSize: "0.8rem", marginTop: 4 }}>
          {editing && !file ? "Leave empty to keep the current file. " : ""}
          {type === "photo" ? "Images uploaded to ImageKit" : "Videos uploaded to Cloudinary"}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept={type === "photo" ? "image/*" : "video/*"}
          style={{ display: "none" }}
          onChange={(event) => handleFile(event.target.files[0])}
        />
      </div>
      {previewUrl && (
        <div style={{ marginBottom: 16, borderRadius: 10, overflow: "hidden", maxHeight: 180 }}>
          {type === "video" ? (
            <video src={previewUrl} style={{ width: "100%", height: 180, objectFit: "cover" }} controls />
          ) : (
            <img src={previewUrl} alt="Media preview" style={{ width: "100%", height: 180, objectFit: "cover" }} />
          )}
        </div>
      )}
      <div className="field-group">
        <label htmlFor="media-category">Category</label>
        <select
          className="field"
          id="media-category"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setSubcategory("");
          }}
          required
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>
      <div className="field-group">
        <label htmlFor="media-subcategory">Subcategory</label>
        <select
          className="field"
          id="media-subcategory"
          value={subcategory}
          onChange={(event) => setSubcategory(event.target.value)}
        >
          <option value="">— None —</option>
          {subcategories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
    </Modal>
  );
}
