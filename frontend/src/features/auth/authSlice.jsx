import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axios from "axios"

const API_URL = "http://localhost:8080/api/auth"

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, thunkAPI) => {
    try {
      const response = await axios.post(
        `${API_URL}/login`,
        credentials
      )

      return response.data
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Login failed"
      )
    }
  }
)

const authSlice = createSlice({
  name: "auth",
  initialState : {
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null,
    isAuthenticated: !!localStorage.getItem("token"),
    loading: false,
    error: null
  },

  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null

      localStorage.removeItem("user")
      localStorage.removeItem("token")
    },

    clearError: (state) => {
      state.error = null
    }
  },

  extraReducers: (builder) => {

    // LOGIN PENDING
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true
      state.error = null
    })

    // LOGIN SUCCESS
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false

      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true

      // localStorage save
      localStorage.setItem("user", JSON.stringify(action.payload.user))
      localStorage.setItem("token", action.payload.token)
    })

    // LOGIN FAILED
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })
  }
})


export const { logout, clearError } = authSlice.actions

export const selectUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectAuth = (state) => state.auth.isAuthenticated
export const selectLoading = (state) => state.auth.loading
export const selectError = (state) => state.auth.error

export default authSlice.reducer