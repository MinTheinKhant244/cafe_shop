import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

export const fetchAllTables = createAsyncThunk("tables/fetchAll", async () => {
  const response = await api.get("/tables/all");
  return response.data;
});

export const addTable = createAsyncThunk("tables/add", async (tableData, { rejectWithValue }) => {
  try {
    const response = await api.post("/tables/create", tableData);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data); // Backend က ပေးလိုက်တဲ့ "Table already exists" ကို ယူပါမယ်
  }
});

export const updateTableStatus = createAsyncThunk("tables/updateStatus", async ({ id, status }) => {
  const response = await api.patch(`/tables/update-status/${id}?status=${status}`);
  return response.data;
});

const tableSlice = createSlice({
  name: "tables",
  initialState: { list: [], loading: false },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTables.fulfilled, (state, action) => { state.list = action.payload; })
      .addCase(addTable.fulfilled, (state, action) => { state.list.push(action.payload); })
      .addCase(updateTableStatus.fulfilled, (state, action) => {
        const index = state.list.findIndex(t => t.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      });
  },
});

export default tableSlice.reducer;