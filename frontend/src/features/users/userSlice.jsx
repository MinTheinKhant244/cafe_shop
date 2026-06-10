import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

export const fetchAllUsers = createAsyncThunk("users/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/users/all");
    return response.data;
  } catch (error) { return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch"); }
});

export const addUser = createAsyncThunk("users/add", async (userData, thunkAPI) => {
  try {
    const response = await api.post("/users/create", userData);
    return response.data;
  } catch (error) { return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to add"); }
});

export const updateUser = createAsyncThunk("users/update", async (userData, thunkAPI) => {
  try {
    // Password ကို ဖယ်ထုတ်ပြီးမှ ပို့ရန်လိုအပ်ပါက API call မတိုင်ခင် စစ်ဆေးနိုင်သည်
    const response = await api.put(`/users/update/${userData.id}`, userData);
    return response.data;
  } catch (error) { return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update"); }
});

export const deactivateUser = createAsyncThunk("users/deactivate", async (id, thunkAPI) => {
  try {
    const response = await api.put(`/users/deactivate/${id}`);
    return response.data;
  } catch (error) { return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to deactivate"); }
});

export const activateUser = createAsyncThunk("users/activate", async (id, thunkAPI) => {
  try {
    const response = await api.put(`/users/activate/${id}`);
    return response.data;
  } catch (error) { return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to activate"); }
});

const userSlice = createSlice({
  name: "users",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => { state.loading = true; })
      .addCase(fetchAllUsers.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(addUser.fulfilled, (state, action) => { state.list.push(action.payload); })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.list.findIndex(u => u.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      })
      .addCase(deactivateUser.fulfilled, (state, action) => {
        const index = state.list.findIndex(u => u.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      })
      .addCase(activateUser.fulfilled, (state, action) => {
        const index = state.list.findIndex(u => u.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      });
  },
});

export default userSlice.reducer;