import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, thunkAPI) => {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials);
      return response.data; 
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data || error.message || "Login failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const getInitialUser = () => {
  const localUser = localStorage.getItem("user");
  if (!localUser || localUser === "undefined") {
    return null;
  }
  try {
    return JSON.parse(localUser);
  } catch (error) {
    console.error("Failed to parse user from localStorage", error);
    return null;
  }
};

const getInitialToken = () => {
  const localToken = localStorage.getItem("token");
  if (!localToken || localToken === "undefined") {
    return null;
  }
  return localToken;
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: getInitialUser(),
    token: getInitialToken(),
    isAuthenticated: !!getInitialToken(),
    loading: false,
    error: null,
  },

  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload?.user || null;
      state.token = action.payload?.token || null;
      state.isAuthenticated = !!action.payload?.token;

      if (action.payload?.user) {
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      }
      if (action.payload?.token) {
        localStorage.setItem("token", action.payload.token);
      }
    });

    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { logout, clearError } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectAuth = (state) => state.auth.isAuthenticated;
export const selectLoading = (state) => state.auth.loading;
export const selectError = (state) => state.auth.error;

export const selectUserRole = (state) => {
  return state.auth.user?.role || null;
};

export default authSlice.reducer;