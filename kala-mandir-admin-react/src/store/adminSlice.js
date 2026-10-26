import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import {
  apiRequest,
  normalizeCategory,
  normalizeMedia,
  uploadRequest,
} from "../api";

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("kalamandir-admin-user")) || null;
  } catch {
    return null;
  }
};

export const fetchAdminData = createAsyncThunk(
  "admin/fetchData",
  async (token, { rejectWithValue }) => {
    try {
      const [categoryResult, mediaResult, eventCategoryResult, eventResult, enquiryResult] =
        await Promise.all([
          apiRequest("/admin/categories", { token }),
          apiRequest("/admin/media", { token }),
          apiRequest("/admin/event-categories", { token }),
          apiRequest("/admin/events", { token }),
          apiRequest("/admin/enquiries", { token }),
        ]);

      return {
        categories: categoryResult.data.map(normalizeCategory),
        media: mediaResult.data.map(normalizeMedia),
        eventCategories: eventCategoryResult.data.map((category) => ({
          ...category,
          id: category._id,
        })),
        events: eventResult.data.map((event) => ({ ...event, id: event._id })),
        enquiries: enquiryResult.data.map((enquiry) => ({
          ...enquiry,
          id: enquiry._id,
        })),
      };
    } catch (error) {
      return rejectWithValue(error.message || "Could not load admin data.");
    }
  },
);

const getSessionToken = (getState, rejectWithValue) => {
  const token = getState().admin.auth.token;
  return token || rejectWithValue("Your session has expired. Please sign in again.");
};

const refreshAdminData = async (token, dispatch) => {
  await dispatch(fetchAdminData(token)).unwrap();
};

export const saveGalleryMedia = createAsyncThunk(
  "admin/saveGalleryMedia",
  async ({ id, formData, onProgress }, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = getSessionToken(getState, rejectWithValue);
      if (typeof token !== "string") return token;
      await uploadRequest(id ? `/admin/media/${id}` : "/admin/media", {
        token,
        method: id ? "PUT" : "POST",
        body: formData,
        onProgress,
      });
      await refreshAdminData(token, dispatch);
      return { id: id || null };
    } catch (error) {
      return rejectWithValue(error.message || "Could not save gallery media.");
    }
  },
);

export const saveAdminEvent = createAsyncThunk(
  "admin/saveEvent",
  async ({ id, formData, onProgress }, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = getSessionToken(getState, rejectWithValue);
      if (typeof token !== "string") return token;
      await uploadRequest(id ? `/admin/events/${id}` : "/admin/events", {
        token,
        method: id ? "PUT" : "POST",
        body: formData,
        onProgress,
      });
      await refreshAdminData(token, dispatch);
      return { id: id || null };
    } catch (error) {
      return rejectWithValue(error.message || "Could not save event.");
    }
  },
);

export const saveGalleryCategory = createAsyncThunk(
  "admin/saveCategory",
  async (data, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = getSessionToken(getState, rejectWithValue);
      if (typeof token !== "string") return token;
      await apiRequest(data.id ? `/admin/categories/${data.id}` : "/admin/categories", {
        token,
        method: data.id ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
      await refreshAdminData(token, dispatch);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Could not save category.");
    }
  },
);

export const saveGallerySubcategory = createAsyncThunk(
  "admin/saveSubcategory",
  async ({ categoryId, name, originalCategoryId, originalName }, {
    getState,
    dispatch,
    rejectWithValue,
  }) => {
    try {
      const token = getSessionToken(getState, rejectWithValue);
      if (typeof token !== "string") return token;
      const categories = getState().admin.data.categories;
      const category = categories.find((item) => item.id === categoryId);
      if (!category) return rejectWithValue("Please select a valid category.");
      if (category.subcategories.some(
        (item) => item.toLowerCase() === name.toLowerCase() &&
          !(categoryId === originalCategoryId && item === originalName),
      )) {
        return rejectWithValue("This subcategory already exists in the selected category.");
      }

      const subcategories = categoryId === originalCategoryId
        ? category.subcategories.map((item) => item === originalName ? name : item)
        : [...category.subcategories, name];
      await apiRequest(`/admin/categories/${categoryId}`, {
        token,
        method: "PUT",
        body: JSON.stringify({ name: category.name, subcategories }),
      });

      if (originalCategoryId && originalCategoryId !== categoryId) {
        const originalCategory = categories.find((item) => item.id === originalCategoryId);
        if (originalCategory) {
          await apiRequest(`/admin/categories/${originalCategoryId}`, {
            token,
            method: "PUT",
            body: JSON.stringify({
              name: originalCategory.name,
              subcategories: originalCategory.subcategories.filter((item) => item !== originalName),
            }),
          });
        }
      }
      await refreshAdminData(token, dispatch);
      return { categoryId, name };
    } catch (error) {
      return rejectWithValue(error.message || "Could not save subcategory.");
    }
  },
);

export const saveEventCategory = createAsyncThunk(
  "admin/saveEventCategory",
  async (data, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = getSessionToken(getState, rejectWithValue);
      if (typeof token !== "string") return token;
      await apiRequest(
        data.id ? `/admin/event-categories/${data.id}` : "/admin/event-categories",
        {
          token,
          method: data.id ? "PUT" : "POST",
          body: JSON.stringify({ name: data.name }),
        },
      );
      await refreshAdminData(token, dispatch);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Could not save event category.");
    }
  },
);

export const deleteAdminItem = createAsyncThunk(
  "admin/deleteItem",
  async ({ type, id, categoryId, name }, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = getSessionToken(getState, rejectWithValue);
      if (typeof token !== "string") return token;

      if (type === "subcategory") {
        const category = getState().admin.data.categories.find((item) => item.id === categoryId);
        if (!category) return rejectWithValue("Category not found.");
        await apiRequest(`/admin/categories/${category.id}`, {
          token,
          method: "PUT",
          body: JSON.stringify({
            name: category.name,
            subcategories: category.subcategories.filter((item) => item !== name),
          }),
        });
      } else {
        const paths = {
          media: `/admin/media/${id}`,
          category: `/admin/categories/${id}`,
          event: `/admin/events/${id}`,
          "event-category": `/admin/event-categories/${id}`,
          enquiry: `/admin/enquiries/${id}`,
        };
        const path = paths[type];
        if (!path) return rejectWithValue("Unsupported item type.");
        await apiRequest(path, { token, method: "DELETE" });
      }

      await refreshAdminData(token, dispatch);
      return { type, id, categoryId, name };
    } catch (error) {
      return rejectWithValue(error.message || "Could not delete item.");
    }
  },
);

const mutationThunks = [
  saveGalleryMedia,
  saveAdminEvent,
  saveGalleryCategory,
  saveGallerySubcategory,
  saveEventCategory,
  deleteAdminItem,
];

const initialState = {
  auth: {
    token: localStorage.getItem("kalamandir-admin-token"),
    user: readStoredUser(),
  },
  data: {
    categories: [],
    media: [],
    eventCategories: [],
    events: [],
    enquiries: [],
  },
  loading: false,
  mutationCount: 0,
  error: "",
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setSession(state, action) {
      state.auth.token = action.payload.token;
      state.auth.user = action.payload.user;
      state.error = "";
    },
    clearSession(state) {
      state.auth = { token: null, user: null };
      state.data = initialState.data;
      state.loading = false;
      state.mutationCount = 0;
      state.error = "";
    },
    setAdminError(state, action) {
      state.error = action.payload;
    },
    clearAdminError(state) {
      state.error = "";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchAdminData.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchAdminData.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(fetchAdminData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || "Could not load admin data.";
      })
      .addMatcher(
        isAnyOf(...mutationThunks.map((thunk) => thunk.pending)),
        (state) => {
          state.mutationCount += 1;
          state.error = "";
        },
      )
      .addMatcher(
        isAnyOf(...mutationThunks.map((thunk) => thunk.fulfilled)),
        (state) => {
          state.mutationCount = Math.max(0, state.mutationCount - 1);
        },
      )
      .addMatcher(
        isAnyOf(...mutationThunks.map((thunk) => thunk.rejected)),
        (state) => {
          state.mutationCount = Math.max(0, state.mutationCount - 1);
          // No state.error here: mutation failures surface via inline form
          // errors or toasts in App.jsx, not the global error banner.
        },
      );
  },
});

export const { setSession, clearSession, setAdminError, clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
