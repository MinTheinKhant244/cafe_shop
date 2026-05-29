import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api"; 

// 1. Get All Users
export const fetchAllUsers = createAsyncThunk("users/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/users/all");
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch users");
  }
});

// 2. Add New User
export const addUser = createAsyncThunk("users/add", async (userData, thunkAPI) => {
  try {
    const response = await api.post("/users/create", userData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to add user");
  }
});

// 3. Update User
export const updateUser = createAsyncThunk("users/update", async (userData, thunkAPI) => {
  try {
    const response = await api.put(`/users/update/${userData.id}`, userData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update user");
  }
});

// 4. Deactivate User
export const deactivateUser = createAsyncThunk("users/deactivate", async (id, thunkAPI) => {
  try {
    const response = await api.put(`/users/deactivate/${id}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to deactivate");
  }
});

// 5. Activate User
export const activateUser = createAsyncThunk("users/activate", async (id, thunkAPI) => {
  try {
    const response = await api.put(`/users/activate/${id}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to activate");
  }
});

const userSlice = createSlice({
  name: "users",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchAllUsers.pending, (state) => { state.loading = true; })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add User
      .addCase(addUser.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      // Update/Deactivate/Activate User (Find and Replace pattern)
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.list.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      })
      .addCase(deactivateUser.fulfilled, (state, action) => {
        const index = state.list.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      })
      .addCase(activateUser.fulfilled, (state, action) => {
        const index = state.list.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      });
  },
});

export default userSlice.reducer;