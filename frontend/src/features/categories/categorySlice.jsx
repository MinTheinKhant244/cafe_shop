import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// 1. Fetch All
export const fetchAllCategories = createAsyncThunk("categories/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/categories/all");
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch");
  }
});

// 2. Search Categories
export const searchCategories = createAsyncThunk("categories/search", async (keyword, thunkAPI) => {
  try {
    const response = await api.get(`/categories/search?keyword=${keyword}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Search failed");
  }
});

// 3. Add Category
export const addCategory = createAsyncThunk("categories/add", async (data, thunkAPI) => {
  try {
    const response = await api.post("/categories/create", data);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to add");
  }
});

// 4. Update Category
export const updateCategory = createAsyncThunk("categories/update", async (data, thunkAPI) => {
  try {
    const response = await api.put(`/categories/update/${data.id}`, data);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update");
  }
});

// 5. Deactivate
export const deactivateCategory = createAsyncThunk("categories/deactivate", async (id, thunkAPI) => {
  try {
    await api.put(`/categories/deactivate/${id}`);
    return id; 
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to deactivate");
  }
});

// 6. Activate
export const activateCategory = createAsyncThunk("categories/activate", async (id, thunkAPI) => {
  try {
    await api.put(`/categories/activate/${id}`);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to activate");
  }
});

const categorySlice = createSlice({
  name: "categories",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchAllCategories.pending, (state) => { state.loading = true; })
      .addCase(fetchAllCategories.fulfilled, (state, action) => { 
        state.loading = false; 
        state.list = action.payload; 
      })
      // Search
      .addCase(searchCategories.fulfilled, (state, action) => { 
        state.list = action.payload; 
      })
      // Add
      .addCase(addCategory.fulfilled, (state, action) => { 
        state.list.push(action.payload); 
      })
      // Update
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.list.findIndex(c => c.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      })
      // Deactivate
      .addCase(deactivateCategory.fulfilled, (state, action) => {
        const cat = state.list.find(c => c.id === action.payload);
        if (cat) cat.isActive = false;
      })
      // Activate
      .addCase(activateCategory.fulfilled, (state, action) => {
        const cat = state.list.find(c => c.id === action.payload);
        if (cat) cat.isActive = true;
      });
  },
});

export default categorySlice.reducer;