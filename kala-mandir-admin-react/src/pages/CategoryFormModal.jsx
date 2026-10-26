import { useState, useEffect } from "react";
import Modal from "../components/Modal";

export default function CategoryFormModal({ open, onClose, onSave, editing }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (editing) {
      setName(editing.name);
    } else {
      setName("");
    }
  }, [open, editing]);

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
    </Modal>
  );
}
