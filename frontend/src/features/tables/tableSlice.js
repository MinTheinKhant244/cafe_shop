import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// ========== FETCH ALL TABLES ==========
export const fetchAllTables = createAsyncThunk(
  "tables/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/tables/all");
      console.log("FetchAllTables Response:", response.data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to fetch tables");
    }
  }
);

// ========== ADD TABLE ==========
export const addTable = createAsyncThunk(
  "tables/add",
  async (tableData, { rejectWithValue }) => {
    try {
      const response = await api.post("/tables/create", tableData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to add table");
    }
  }
);

// ========== UPDATE TABLE STATUS ==========
export const updateTableStatus = createAsyncThunk(
  "tables/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/tables/update-status/${id}?status=${status}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to update status");
    }
  }
);

// ========== MERGE TABLES ==========
export const mergeTables = createAsyncThunk(
  "tables/merge",
  async ({ masterTableId, subTableId }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/tables/merge?masterTableId=${masterTableId}&subTableId=${subTableId}`
      );
      return { data: response.data, masterTableId, subTableId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Merge failed");
    }
  }
);

// ========== UNMERGE TABLE ==========
export const unmergeTable = createAsyncThunk(
  "tables/unmerge",
  async (subTableId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/tables/unmerge/${subTableId}`);
      return { data: response.data, subTableId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Unmerge failed");
    }
  }
);

// ========== SET AS MASTER ==========
export const setMaster = createAsyncThunk(
  "tables/setMaster",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/tables/set-master/${id}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to set as master");
    }
  }
);

// ========== REMOVE MASTER STATUS ==========
export const removeMaster = createAsyncThunk(
  "tables/removeMaster",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/tables/remove-master/${id}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to remove master status");
    }
  }
);

// ========== DELETE TABLE ==========
export const deleteTable = createAsyncThunk(
  "tables/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/tables/delete/${id}`);
      return { data: response.data, id };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to delete table");
    }
  }
);

// ========== SLICE ==========
const tableSlice = createSlice({
  name: "tables",
  initialState: {
    list: [],
    loading: false,
    error: null,
    operationLoading: false,
    lastOperation: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLastOperation: (state) => {
      state.lastOperation = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ========== FETCH ALL TABLES ==========
      .addCase(fetchAllTables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTables.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        // Debug log
        if (action.payload && action.payload.length > 0) {
          console.log("Tables loaded:", action.payload.length);
          console.log("First table isMaster:", action.payload[0]?.isMaster);
        }
      })
      .addCase(fetchAllTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== ADD TABLE ==========
      .addCase(addTable.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(addTable.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.list.push(action.payload);
        state.lastOperation = { type: "add", success: true, data: action.payload };
      })
      .addCase(addTable.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
        state.lastOperation = { type: "add", success: false, error: action.payload };
      })

      // ========== UPDATE STATUS ==========
      .addCase(updateTableStatus.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(updateTableStatus.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.list.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        state.lastOperation = { type: "updateStatus", success: true, data: action.payload };
      })
      .addCase(updateTableStatus.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
        state.lastOperation = { type: "updateStatus", success: false, error: action.payload };
      })

      // ========== SET MASTER ==========
      .addCase(setMaster.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(setMaster.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.list.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        state.lastOperation = { type: "setMaster", success: true, data: action.payload };
      })
      .addCase(setMaster.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
        state.lastOperation = { type: "setMaster", success: false, error: action.payload };
      })

      // ========== REMOVE MASTER ==========
      .addCase(removeMaster.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(removeMaster.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.list.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        state.lastOperation = { type: "removeMaster", success: true, data: action.payload };
      })
      .addCase(removeMaster.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
        state.lastOperation = { type: "removeMaster", success: false, error: action.payload };
      })

      // ========== MERGE TABLES ==========
      .addCase(mergeTables.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(mergeTables.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.lastOperation = { type: "merge", success: true, data: action.payload };
      })
      .addCase(mergeTables.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
        state.lastOperation = { type: "merge", success: false, error: action.payload };
      })

      // ========== UNMERGE TABLE ==========
      .addCase(unmergeTable.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(unmergeTable.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.lastOperation = { type: "unmerge", success: true, data: action.payload };
      })
      .addCase(unmergeTable.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
        state.lastOperation = { type: "unmerge", success: false, error: action.payload };
      })

      // ========== DELETE TABLE ==========
      .addCase(deleteTable.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(deleteTable.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.list = state.list.filter((t) => t.id !== action.payload.id);
        state.lastOperation = { type: "delete", success: true, data: action.payload };
      })
      .addCase(deleteTable.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
        state.lastOperation = { type: "delete", success: false, error: action.payload };
      });
  },
});

export const { clearError, clearLastOperation } = tableSlice.actions;
export default tableSlice.reducer;