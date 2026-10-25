import { useEffect, useState } from "react";
import Modal from "../components/Modal";

export default function SubcategoryFormModal({
  open,
  onClose,
  onSave,
  categories,
  editing,
}) {
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCategoryId(editing?.categoryId || "");
    setName(editing?.name || "");
    setError("");
  }, [open, editing]);

  const handleSave = async () => {
    if (!categoryId) {
      setError("Please select a category first.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter a subcategory name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        categoryId,
        name: name.trim(),
        originalCategoryId: editing?.categoryId,
        originalName: editing?.name,
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
      title={editing ? "Edit Subcategory" : "Add Subcategory"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editing ? "Save Changes" : "Create Subcategory"}
          </button>
        </>
      }
    >
      {error && <div className="error-banner" role="alert">{error}</div>}
      <div className="field-group">
        <label htmlFor="subcategory-category">Category</label>
        <select
          className="field"
          id="subcategory-category"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          disabled={Boolean(editing)}
          required
        >
          <option value="">Choose a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.type})
            </option>
          ))}
        </select>
      </div>
      <div className="field-group">
        <label htmlFor="subcategory-name">Subcategory Name</label>
        <input
          className="field"
          id="subcategory-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Kathak"
          required
        />
      </div>
    </Modal>
  );
}
