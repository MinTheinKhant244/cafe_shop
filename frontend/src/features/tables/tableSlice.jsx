import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

export const fetchAllTables = createAsyncThunk(
  "tables/fetchAll",
  async () => {
    const response = await api.get("/tables/all");
    return response.data;
  }
);

export const addTable = createAsyncThunk(
  "tables/add",
  async (tableData, { rejectWithValue }) => {
    try {
      const response = await api.post("/tables/create", tableData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed");
    }
  }
);

export const updateTableStatus = createAsyncThunk(
  "tables/updateStatus",
  async ({ id, status }) => {
    const response = await api.patch(
      `/tables/update-status/${id}?status=${status}`
    );
    return response.data;
  }
);

export const mergeTables = createAsyncThunk(
  "tables/merge",
  async ({ masterTableId, subTableId }) => {
    const response = await api.post(
      `/tables/merge?masterTableId=${masterTableId}&subTableId=${subTableId}`
    );
    return response.data;
  }
);

export const unmergeTable = createAsyncThunk(
  "tables/unmerge",
  async (subTableId) => {
    const response = await api.post(`/tables/unmerge/${subTableId}`);
    return response.data;
  }
);

export const setMaster = createAsyncThunk(
  "tables/setMaster",
  async (id) => {
    const response = await api.post(`/tables/set-master/${id}`);
    return response.data;
  }
);

const tableSlice = createSlice({
  name: "tables",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTables.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchAllTables.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })

      .addCase(fetchAllTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(addTable.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })

      .addCase(updateTableStatus.fulfilled, (state, action) => {
        const index = state.list.findIndex(
          (t) => t.id === action.payload.id
        );

        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })

      .addCase(setMaster.fulfilled, (state, action) => {
        const index = state.list.findIndex(
          (t) => t.id === action.payload.id
        );

        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })

      .addCase(mergeTables.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(unmergeTable.fulfilled, (state) => {
        state.loading = false;
      });
  },
});

export default tableSlice.reducer;