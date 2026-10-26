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
      aw