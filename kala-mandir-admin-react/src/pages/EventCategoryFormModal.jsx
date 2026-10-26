import { useEffect, useState } from "react";
import Modal from "../components/Modal";

export default function EventCategoryFormModal({ open, onClose, onSave, editing }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name || "");
    setError("");
  }, [open, editing]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter an event category name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ id: editing?.id, name: trimmedName });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Event Category" : "Add Event Category"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Category"}
          </button>
        </>
      }
    >
      {error && <div className="error-banner" role="alert">{error}</div>}
      <div className="field-group">
        <label htmlFor="event-category-name">Category Name</label>
        <input
          className="field"
          id="event-category-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Dance Workshop"
          required
        />
      </div>
    </Modal>
  );
}
