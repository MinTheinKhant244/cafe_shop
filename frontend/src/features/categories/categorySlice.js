import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// 1. Fetch All
export const fetchAllCategories = createAsyncThunk("categories/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/categories/all");
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch categories");
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
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to add category");
  }
});

// 4. Update Category
export const updateCategory = createAsyncThunk("categories/update", async (data, thunkAPI) => {
  try {
    const response = await api.put(`/categories/update/${data.id}`, data);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update category");
  }
});

// 5. Deactivate
export const deactivateCategory = createAsyncThunk("categories/deactivate", async (id, thunkAPI) => {
  try {
    await api.put(`/categories/deactivate/${id}`);
    return id; 
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to deactivate category");
  }
});

// 6. Activate
export const activateCategory = createAsyncThunk("categories/activate", async (id, thunkAPI) => {
  try {
    await api.put(`/categories/activate/${id}`);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to activate category");
  }
});

const categorySlice = createSlice({
  name: "categories",
  initialState: { 
    list: [], 
    loading: false, 
    error: null,
    operationLoading: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetCategories: (state) => {
      state.list = [];
      state.error = null;
      state.loading = false;
      state.operationLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchAllCategories.pending, (state) => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(fetchAllCategories.fulfilled, (state, action) => { 
        state.loading = false; 
        state.list = action.payload; 
        state.error = null;
      })
      .addCase(fetchAllCategories.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
      })
      
      // Search
      .addCase(searchCategories.pending, (state) => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(searchCategories.fulfilled, (state, action) => { 
        state.loading = false;
        state.list = action.payload; 
        state.error = null;
      })
      .addCase(searchCategories.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
      })
      
      // Add Category
      .addCase(addCategory.pending, (state) => { 
        state.operationLoading = true; 
        state.error = null;
      })
      .addCase(addCategory.fulfilled, (state, action) => { 
        state.operationLoading = false;
        state.list.push(action.payload); 
        state.error = null;
      })
      .addCase(addCategory.rejected, (state, action) => { 
        state.operationLoading = false; 
        state.error = action.payload; 
      })
      
      // Update Category
      .addCase(updateCategory.pending, (state) => { 
        state.operationLoading = true; 
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.list.findIndex(c => c.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        state.error = null;
      })
      .addCase(updateCategory.rejected, (state, action) => { 
        state.operationLoading = false; 
        state.error = action.payload; 
      })
      
      // Deactivate
      .addCase(deactivateCategory.pending, (state) => { 
        state.operationLoading = true; 
        state.error = null;
      })
      .addCase(deactivateCategory.fulfilled, (state, action) => {
        state.operationLoading = false;
        const cat = state.list.find(c => c.id === action.payload);
        if (cat) cat.isActive = false;
        state.error = null;
      })
      .addCase(deactivateCategory.rejected, (state, action) => { 
        state.operationLoading = false; 
        state.error = action.payload; 
      })
      
      // Activate
      .addCase(activateCategory.pending, (state) => { 
        state.operationLoading = true; 
        state.error = null;
      })
      .addCase(activateCategory.fulfilled, (state, action) => {
        state.operationLoading = false;
        const cat = state.list.find(c => c.id === action.payload);
        if (cat) cat.isActive = true;
        state.error = null;
      })
      .addCase(activateCategory.rejected, (state, action) => { 
        state.operationLoading = false; 
        state.error = action.payload; 
      });
  },
});

export const { clearError, resetCategories } = categorySlice.actions;
export default categorySlice.reducer;