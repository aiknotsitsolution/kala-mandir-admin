import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Gallery from "./pages/Gallery";
import Categories from "./pages/Categories";
import Subcategories from "./pages/Subcategories";
import AdminEvents from "./pages/AdminEvents";
import EventCategories from "./pages/EventCategories";
import Enquiries from "./pages/Enquiries";
import MediaFormModal from "./pages/MediaFormModal";
import CategoryFormModal from "./pages/CategoryFormModal";
import SubcategoryFormModal from "./pages/SubcategoryFormModal";
import EventFormModal from "./pages/EventFormModal";
import EventCategoryFormModal from "./pages/EventCategoryFormModal";
import Modal from "./components/Modal";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import {
  clearAdminError,
  clearSession,
  fetchAdminData,
  deleteAdminItem,
  saveAdminEvent,
  saveEventCategory as saveEventCategoryAction,
  saveGalleryCategory,
  saveGalleryMedia,
  saveGallerySubcategory,
  setAdminError,
  setSession,
} from "./store/adminSlice";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  gallery: "Gallery",
  categories: "Categories",
  subcategories: "Subcategories",
  events: "Events",
  "event-categories": "Event Categories",
  enquiries: "Enquiries",
};

export default function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.admin.auth);
  const { categories, media, eventCategories, events, enquiries } =
    useSelector((state) => state.admin.data);
  const loading = useSelector((state) => state.admin.loading);
  const mutationCount = useSelector((state) => state.admin.mutationCount);
  const error = useSelector((state) => state.admin.error);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const setError = useCallback((message) => dispatch(setAdminError(message)), [dispatch]);
  const runMutation = useCallback(async (action) => {
    try {
      const result = await dispatch(action).unwrap();
      dispatch(clearAdminError());
      return result;
    } catch (cause) {
      const message = typeof cause === "string" ? cause : cause.message;
      setError(message || "The requested change failed.");
      throw new Error(message || "The requested change failed.");
    }
  }, [dispatch, setError]);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventCategoryModalOpen, setEventCategoryModalOpen] = useState(false);
  const [editingEventCategory, setEditingEventCategory] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const refreshData = useCallback(async () => {
    if (!token) return;
    try {
      await dispatch(fetchAdminData(token)).unwrap();
    } catch (err) {
      const message = typeof err === "string" ? err : err.message;
      if (/token|authentication/i.test(message || "")) {
        localStorage.removeItem("kalamandir-admin-token");
        localStorage.removeItem("kalamandir-admin-user");
        dispatch(clearSession());
      }
    }
  }, [dispatch, token]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleAuth = (result) => {
    localStorage.setItem("kalamandir-admin-token", result.token);
    localStorage.setItem("kalamandir-admin-user", JSON.stringify(result.user));
    dispatch(setSession({ token: result.token, user: result.user }));
  };

  const logout = () => {
    localStorage.removeItem("kalamandir-admin-token");
    localStorage.removeItem("kalamandir-admin-user");
    dispatch(clearSession());
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
    await runMutation(saveGalleryMedia({ formData, id, onProgress }));
    setMediaModalOpen(false);
  };

  const openAddEvent = () => {
    setEditingEvent(null);
    setEventModalOpen(true);
  };
  const openEditEvent = (event) => {
    setEditingEvent(event);
    setEventModalOpen(true);
  };
  const saveEvent = async (formData, id, onProgress) => {
    await runMutation(saveAdminEvent({ formData, id, onProgress }));
    setEventModalOpen(false);
  };
  const openAddEventCategory = () => {
    setEditingEventCategory(null);
    setEventCategoryModalOpen(true);
  };
  const openEditEventCategory = (category) => {
    setEditingEventCategory(category);
    setEventCategoryModalOpen(true);
  };
  const saveEventCategory = async (data) => {
    await runMutation(saveEventCategoryAction(data));
    setEventCategoryModalOpen(false);
  };

  const openAddCategory = () => {
    setEditingCat(null);
    setCatModalOpen(true);
  };
  const openEditCategory = (category) => {
    setEditingCat(category);
    setCatModalOpen(true);
  };
  const saveCategory = async (data) => {
    await runMutation(saveGalleryCategory(data));
    setCatModalOpen(false);
  };
  const openAddSubcategory = () => {
    setEditingSubcategory(null);
    setSubcategoryModalOpen(true);
  };
  const openEditSubcategory = (category, name) => {
    setEditingSubcategory({ categoryId: category.id, name });
    setSubcategoryModalOpen(true);
  };
  const saveSubcategory = async ({
    categoryId,
    name,
    originalCategoryId,
    originalName,
  }) => {
    await runMutation(saveGallerySubcategory({
      categoryId,
      name,
      originalCategoryId,
      originalName,
    }));
    setSubcategoryModalOpen(false);
    setEditingSubcategory(null);
  };

  const requestDelete = (type, item) => {
    setPendingDelete({ type, id: item.id, category: item.category, name: item.name });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await runMutation(deleteAdminItem({
        type: pendingDelete.type,
        id: pendingDelete.id,
        categoryId: pendingDelete.category?.id,
        name: pendingDelete.name,
      }));
      setConfirmOpen(false);
      setPendingDelete(null);
    } catch (err) {
      setConfirmOpen(false);
      setPendingDelete(null);
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
              <button type="button" onClick={() => dispatch(clearAdminError())} aria-label="Dismiss error">×</button>
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
                  events={events}
                  eventCategories={eventCategories}
                  enquiries={enquiries}
                  user={user}
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
              {page === "events" && (
                <AdminEvents
                  events={events}
                  categories={eventCategories}
                  onAdd={openAddEvent}
                  onEdit={openEditEvent}
                  onDelete={(item) => requestDelete("event", item)}
                />
              )}
              {page === "event-categories" && (
                <EventCategories
                  categories={eventCategories}
                  onAdd={openAddEventCategory}
                  onEdit={openEditEventCategory}
                  onDelete={(item) => requestDelete("event-category", item)}
                />
              )}
              {page === "enquiries" && (
                <Enquiries
                  enquiries={enquiries}
                  onDelete={(item) => requestDelete("enquiry", item)}
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
      />
      <SubcategoryFormModal
        open={subcategoryModalOpen}
        onClose={() => {
          setSubcategoryModalOpen(false);
          setEditingSubcategory(null);
        }}
        onSave={saveSubcategory}
        editing={editingSubcategory}
        categories={categories}
      />
      <EventFormModal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSave={saveEvent}
        editing={editingEvent}
        categories={eventCategories}
      />
      <EventCategoryFormModal
        open={eventCategoryModalOpen}
        onClose={() => setEventCategoryModalOpen(false)}
        onSave={saveEventCategory}
        editing={editingEventCategory}
      />
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Delete"
        maxWidth="380px"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDelete} disabled={mutationCount > 0}>
              {mutationCount > 0 ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
          {pendingDelete?.type === "media"
            ? "Delete this media item and its uploaded file? This cannot be undone."
            : pendingDelete?.type === "event"
              ? "Delete this event and its uploaded media file? This cannot be undone."
              : pendingDelete?.type === "event-category"
                ? "Delete this event category? Categories assigned to events cannot be deleted."
                : pendingDelete?.type === "enquiry"
                  ? "Delete this enquiry? This action cannot be undone."
              : pendingDelete?.type === "subcategory"
              ? "Delete this subcategory? Subcategories assigned to gallery media cannot be deleted."
              : "Delete this category and its subcategories? Categories containing media cannot be deleted."}
        </p>
      </Modal>
    </div>
  );
}
