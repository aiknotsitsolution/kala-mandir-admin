import { useState, useEffect, useRef } from "react";
import Modal from "../components/Modal";

// Browsers report an empty MIME type for some containers (.mkv/.mov on Windows),
// so the extension is the fallback signal.
const getMediaType = ({ type = "", name = "" }) => {
  if (type.startsWith("video/") || /\.(mp4|m4v|mov|webm|ogv|avi|mkv|3gp)$/i.test(name)) {
    return "video";
  }
  if (type.startsWith("image/") || /\.(jpe?g|png|gif|webp|avif|bmp|heic|heif)$/i.test(name)) {
    return "photo";
  }
  return null;
};

export default function MediaFormModal({
  open,
  onClose,
  onSave,
  editing,
  categories,
  mutationCount = 0,
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("photo");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const fileRef = useRef(null);
  const zoneRef = useRef(null);
  const submittingRef = useRef(false);

  const currentCategory = categories.find((category) => category.id === categoryId);
  const subcategories = currentCategory?.subcategories || [];

  const invalidFields = {
    title: attempted && !title.trim(),
    category: attempted && !categoryId,
    subcategory: attempted && !subcategory && subcategories.length > 0,
    file: attempted && !file && (editing ? type !== editing.type : true),
  };

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title || "");
    setType(editing?.type || "photo");
    setCategoryId(editing?.categoryId || "");
    setSubcategory(editing?.subcategory || "");
    setFile(null);
    setPreviewUrl(
      editing?.type === "video" ? editing.url || "" : editing?.thumb || "",
    );
    setError("");
    setUploadProgress(null);
    setAttempted(false);
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
    const detectedType = getMediaType(selectedFile);
    if (!detectedType) {
      setError("Select a photo or video file.");
      return;
    }
    setType(detectedType);
    setFile(selectedFile);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current || mutationCount > 0) return;
    const fail = (message) => {
      setAttempted(true);
      return setError(message);
    };
    if (!title.trim()) return fail("Please enter a title.");
    if (!categoryId) return fail("Please create and select a matching category first.");
    // Categories without any subcategory can't satisfy this, so only ask when the
    // selected category actually offers choices.
    if (!subcategory && subcategories.length > 0) {
      return fail("Please select a subcategory.");
    }
    if (!editing && !file) return fail(`Please select a ${type === "photo" ? "photo" : "video"} to upload.`);
    if (editing && type !== editing.type && !file) {
      return fail("Select a new file when changing the media type.");
    }
    setAttempted(false);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("type", type);
    formData.append("categoryId", categoryId);
    formData.append("subcategory", subcategory);
    if (file) formData.append("file", file);
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      setUploadProgress(0);
      await onSave(formData, editing?.id, setUploadProgress);
    } catch (err) {
      setError(err.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
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
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            type="submit"
            form="media-form"
            className="btn btn-primary"
            disabled={submitting || mutationCount > 0}
          >
            {submitting
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
      <form id="media-form" onSubmit={handleSubmit} noValidate>
      {error && <div className="error-banner" role="alert">{error}</div>}
      {submitting && uploadProgress !== null && (
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
          className={invalidFields.title ? "field is-invalid" : "field"}
          aria-invalid={invalidFields.title}
          id="media-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Kathak Performance"
          required
        />
      </div>
      <div
        className={invalidFields.file ? "upload-zone is-invalid" : "upload-zone"}
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
        <p><strong>{file ? file.name : "Choose a photo or video"}</strong> or drag & drop</p>
        <p style={{ fontSize: "0.8rem", marginTop: 4 }}>
          {editing && !file ? "Leave empty to keep the current file. " : ""}
          {type === "photo" ? "Images uploaded to ImageKit" : "Videos uploaded to Cloudinary"}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={(event) => handleFile(event.target.files[0])}
        />
      </div>
      {previewUrl && (
        <div style={{ marginBottom: 16, borderRadius: 10, overflow: "hidden", maxHeight: 180 }}>
          {type === "video" ? (
            <video key={previewUrl} src={previewUrl} style={{ width: "100%", height: 180, objectFit: "cover" }} controls />
          ) : (
            <img src={previewUrl} alt="Media preview" style={{ width: "100%", height: 180, objectFit: "cover" }} />
          )}
        </div>
      )}
      <div className="field-group">
        <label htmlFor="media-category">Category</label>
        <select
          className={invalidFields.category ? "field is-invalid" : "field"}
          aria-invalid={invalidFields.category}
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
          className={invalidFields.subcategory ? "field is-invalid" : "field"}
          aria-invalid={invalidFields.subcategory}
          id="media-subcategory"
          value={subcategory}
          required={subcategories.length > 0}
          onChange={(event) => setSubcategory(event.target.value)}
        >
          <option value="">— None —</option>
          {subcategories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      </form>
    </Modal>
  );
}
