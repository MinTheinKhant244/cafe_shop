import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { isSidebarExpanded: false },
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarExpanded = !state.isSidebarExpanded;
    },
  },
});

export const { toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;