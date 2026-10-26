import { useEffect, useState } from "react";
import Modal from "../components/Modal";

export default function ProfileModal({ open, onClose, onSave, user }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsername(user?.username || "");
    setEmail(user?.email || "");
    setPhoto(null);
    setPhotoPreview(user?.profilePhotoUrl || "");
    setError("");
  }, [open, user]);

  useEffect(() => {
    if (!photo) return undefined;
    const previewUrl = URL.createObjectURL(photo);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photo]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      if (photo) formData.append("photo", photo);
      await onSave(formData);
      onClose();
    } catch (saveError) {
      setError(saveError.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit profile"
      maxWidth="480px"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="profile-form" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </>
      }
    >
      <form id="profile-form" onSubmit={handleSubmit}>
        {error && <div className="error-banner" role="alert">{error}</div>}
        <div className="profile-photo-picker">
          {photoPreview ? (
            <img src={photoPreview} alt="Profile preview" className="profile-photo-preview" />
          ) : (
            <span className="profile-photo-placeholder" aria-hidden="true">
              {(username || "A").charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <label htmlFor="profile-photo" className="profile-photo-label">Profile photo</label>
            <input
              id="profile-photo"
              className="field"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const selected = event.target.files?.[0] || null;
                setPhoto(selected);
                if (!selected) setPhotoPreview(user?.profilePhotoUrl || "");
              }}
            />
            <small>JPEG, PNG or WebP, up to 5 MB.</small>
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="profile-username">Username</label>
          <input
            id="profile-username"
            className="field"
            type="text"
            minLength={2}
            maxLength={80}
            autoComplete="name"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>
        <div className="field-group">
          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            className="field"
            type="email"
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <small>Use this email the next time you sign in.</small>
        </div>
      </form>
    </Modal>
  );
}
