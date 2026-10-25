import { useState, useEffect } from "react";
import Modal from "../components/Modal";

export default function CategoryFormModal({ open, onClose, onSave, editing, defaultType }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("photo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (editing) {
      setName(editing.name);
      setType(editing.type);
    } else {
      setName("");
      setType(defaultType || "photo");
    }
  }, [open, editing, defaultType]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a category name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        id: editing?.id,
        name: name.trim(),
        type,
        subcategories: editing?.subcategories || [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Category" : "Add Category"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Category"}
          </button>
        </>
      }
    >
      {error && <div className="error-banner" role="alert">{error}</div>}
      <div className="field-group">
        <label>Category Name</label>
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Classical Dance"
        />
      </div>
      <div className="field-group">
        <label>Type</label>
        <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="photo">Photo</option>
          <option value="video">Video</option>
        </select>
      </div>
    </Modal>
  );
}
