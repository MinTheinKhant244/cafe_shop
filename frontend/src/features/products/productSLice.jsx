import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// 1. Fetch All
export const fetchAllProducts = createAsyncThunk("products/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/products/all");
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch products");
  }
});

// 2. Add (Image Upload အတွက် formData ကို လက်ခံနိုင်ရန်)
export const addProduct = createAsyncThunk("products/add", async (formData, thunkAPI) => {
  try {
    const response = await api.post("/products/create", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to add product");
  }
});

// 3. Update (Image Upload ပါဝင်သည်)
export const updateProduct = createAsyncThunk("products/update", async ({ id, formData }, thunkAPI) => {
  try {
    const response = await api.put(`/products/update/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update product");
  }
});

// 4. Deactivate
export const deactivateProduct = createAsyncThunk("products/deactivate", async (id, thunkAPI) => {
  try {
    await api.put(`/products/deactivate/${id}`);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to deactivate");
  }
});

// 5. Activate
export const activateProduct = createAsyncThunk("products/activate", async (id, thunkAPI) => {
  try {
    await api.put(`/products/activate/${id}`);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to activate");
  }
});

const productSlice = createSlice({
  name: "products",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProducts.fulfilled, (state, action) => { state.list = action.payload; })
      .addCase(addProduct.fulfilled, (state, action) => { state.list.push(action.payload); })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.list.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      })
      .addCase(deactivateProduct.fulfilled, (state, action) => {
        const item = state.list.find(p => p.id === action.payload);
        if (item) item.isActive = false;
      })
      .addCase(activateProduct.fulfilled, (state, action) => {
        const item = state.list.find(p => p.id === action.payload);
        if (item) item.isActive = true;
      });
  },
});

export default productSlice.reducer;