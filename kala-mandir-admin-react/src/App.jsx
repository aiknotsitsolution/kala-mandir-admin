import { useState, useCallback, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Gallery from "./pages/Gallery";
import Categories from "./pages/Categories";
import Subcategories from "./pages/Subcategories";
import MediaFormModal from "./pages/MediaFormModal";
import CategoryFormModal from "./pages/CategoryFormModal";
import SubcategoryFormModal from "./pages/SubcategoryFormModal";
import Modal from "./components/Modal";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { apiRequest, normalizeCategory, normalizeMedia, uploadRequest } from "./api";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  gallery: "Gallery",
  categories: "Categories",
  subcategories: "Subcategories",
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("kalamandir-admin-token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kalamandir-admin-user")) || null;
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catDefaultType, setCatDefaultType] = useState("photo");
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const refreshData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [categoryResult, mediaResult] = await Promise.all([
        apiRequest("/admin/categories", { token }),
        apiRequest("/admin/media", { token }),
      ]);
      setCategories(categoryResult.data.map(normalizeCategory));
      setMedia(mediaResult.data.map(normalizeMedia));
      setError("");
    } catch (err) {
      setError(err.message);
      if (/token|authentication/i.test(err.message)) {
        localStorage.removeItem("kalamandir-admin-token");
        localStorage.removeItem("kalamandir-admin-user");
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleAuth = (result) => {
    localStorage.setItem("kalamandir-admin-token", result.token);
    localStorage.setItem("kalamandir-admin-user", JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
    setError("");
  };

  const logout = () => {
    localStorage.removeItem("kalamandir-admin-token");
    localStorage.removeItem("kalamandir-admin-user");
    setToken(null);
    setUser(null);
    setCategories([]);
    setMedia([]);
  };

  const navigate = useCallback((nextPage) => {
    setPage(nextPage);
    setSidebarOpen(false);
  }, []);

  const openAddMedia = () => {
    setEditingMedia(null);
    setMediaModalOpen(true);
  };
  const openEditMedia = (item) => {
    setEditingMedia(item);
    setMediaModalOpen(true);
  };
  const saveMedia = async (formData, id, onProgress) => {
    try {
      const path = id ? `/admin/media/${id}` : "/admin/media";
      await uploadRequest(path, {
        token,
        method: id ? "PUT" : "POST",
        body: formData,
        onProgress,
      });
      setMediaModalOpen(false);
      setError("");
      await refreshData();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const openAddCategory = (type = "photo") => {
    setEditingCat(null);
    setCatDefaultType(type);
    setCatModalOpen(true);
  };
  const openEditCategory = (category) => {
    setEditingCat(category);
    setCatModalOpen(true);
  };
  const saveCategory = async (data) => {
    try {
      await apiRequest(data.id ? `/admin/categories/${data.id}` : "/admin/categories", {
        token,
        method: data.id ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
      setCatModalOpen(false);
      setError("");
      await refreshData();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  const openAddSubcategory = (type = "photo") => {
    setEditingSubcategory(null);
    setCatDefaultType(type);
    setSubcategoryModalOpen(true);
  };
  const openEditSubcategory = (category, name) => {
    setEditingSubcategory({ categoryId: category.id, name });
    setCatDefaultType(category.type);
    setSubcategoryModalOpen(true);
  };
  const saveSubcategory = async ({
    categoryId,
    name,
    originalCategoryId,
    originalName,
  }) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) throw new Error("Please select a valid category.");
    if (
      category.subcategories.some(
        (item) =>
          item.toLowerCase() === name.toLowerCase() &&
          !(categoryId === originalCategoryId && item === originalName),
      )
    ) {
      throw new Error("This subcategory already exists in the selected category.");
    }

    const updatedSubcategories =
      categoryId === originalCategoryId
        ? category.subcategories.map((item) => (item === originalName ? name : item))
        : [...category.subcategories, name];
    try {
      await apiRequest(`/admin/categories/${categoryId}`, {
        token,
        method: "PUT",
        body: JSON.stringify({
          name: category.name,
          type: category.type,
          subcategories: updatedSubcategories,
        }),
      });
      if (originalCategoryId && originalCategoryId !== categoryId) {
        const originalCategory = categories.find((item) => item.id === originalCategoryId);
        if (originalCategory) {
          await apiRequest(`/admin/categories/${originalCategoryId}`, {
            token,
            method: "PUT",
            body: JSON.stringify({
              name: originalCategory.name,
              type: originalCategory.type,
              subcategories: originalCategory.subcategories.filter(
                (item) => item !== originalName,
              ),
            }),
          });
        }
      }
      setSubcategoryModalOpen(false);
      setEditingSubcategory(null);
      setError("");
      await refreshData();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const requestDelete = (type, item) => {
    setPendingDelete({ type, id: item.id, category: item.category, name: item.name });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === "subcategory") {
      const category = categories.find(
        (item) => item.id === pendingDelete.category.id,
      );
      if (!category) {
        setConfirmOpen(false);
        setPendingDelete(null);
        setError("Category not found.");
        return;
      }
      try {
        await apiRequest(`/admin/categories/${category.id}`, {
          token,
          method: "PUT",
          body: JSON.stringify({
            name: category.name,
            type: category.type,
            subcategories: category.subcategories.filter(
              (item) => item !== pendingDelete.name,
            ),
          }),
        });
        setConfirmOpen(false);
        setPendingDelete(null);
        setError("");
        await refreshData();
      } catch (err) {
        setConfirmOpen(false);
        setPendingDelete(null);
        setError(err.message);
      }
      return;
    }
    const path =
      pendingDelete.type === "media"
        ? `/admin/media/${pendingDelete.id}`
        : `/admin/categories/${pendingDelete.id}`;
    try {
      await apiRequest(path, { token, method: "DELETE" });
      setConfirmOpen(false);
      setPendingDelete(null);
      setError("");
      await refreshData();
    } catch (err) {
      setConfirmOpen(false);
      setPendingDelete(null);
      setError(err.message);
    }
  };

  if (!token) return <Login onLogin={handleAuth} />;

  return (
    <div className="app-shell">
      <Sidebar
        currentPage={page}
        onNavigate={navigate}
        onLogout={logout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />
      <div className="main">
        <Topbar title={PAGE_TITLES[page]} onMenuToggle={() => setSidebarOpen((open) => !open)} />
        <div className="content">
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button>
            </div>
          )}
          {loading ? (
            <div className="empty"><p>Loading admin data...</p></div>
          ) : (
            <>
              {page === "dashboard" && (
                <Dashboard
                  media={media}
                  categories={categories}
                  onNavigate={navigate}
                  onEdit={openEditMedia}
                  onDelete={(item) => requestDelete("media", item)}
                />
              )}
              {page === "gallery" && (
                <Gallery
                  media={media}
                  categories={categories}
                  onAdd={openAddMedia}
                  onEdit={openEditMedia}
                  onDelete={(item) => requestDelete("media", item)}
                />
              )}
              {page === "categories" && (
                <Categories
                  categories={categories}
                  onAdd={openAddCategory}
                  onEdit={openEditCategory}
                  onDelete={(item) => requestDelete("category", item)}
                />
              )}
              {page === "subcategories" && (
                <Subcategories
                  categories={categories}
                  onAdd={openAddSubcategory}
                  onEdit={openEditSubcategory}
                  onDelete={(category, name) =>
                    requestDelete("subcategory", { category, name })
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
      <MediaFormModal
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSave={saveMedia}
        editing={editingMedia}
        categories={categories}
      />
      <CategoryFormModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        onSave={saveCategory}
        editing={editingCat}
        defaultType={catDefaultType}
      />
      <SubcategoryFormModal
        open={subcategoryModalOpen}
        onClose={() => {
          setSubcategoryModalOpen(false);
          setEditingSubcategory(null);
        }}
        onSave={saveSubcategory}
        editing={editingSubcategory}
        categories={categories.filter((category) => category.type === catDefaultType)}
      />
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Delete"
        maxWidth="380px"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
          </>
        }
      >
        <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
          {pendingDelete?.type === "media"
            ? "Delete this media item and its uploaded file? This cannot be undone."
            : pendingDelete?.type === "subcategory"
              ? "Delete this subcategory? Subcategories assigned to gallery media cannot be deleted."
              : "Delete this category and its subcategories? Categories containing media cannot be deleted."}
        </p>
      </Modal>
    </div>
  );
}
