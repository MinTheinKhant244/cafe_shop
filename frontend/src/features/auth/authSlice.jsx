import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchUsers=createAsyncThunk(
    "users/fetchUser",
    async ()=>{
        let response=await axios.get("http://localhost:3000/users")
        return response.data
    }
)

const authSlice=createSlice({
    name:"auth",
    initialState:{
        users:[],
        user:null,
        isAuthenticated:false
    },
    reducers:{
        loginSuccess:(state,action)=>{
             let findUser=state.users.find(u=>u.email==action.payload.email)
             if(findUser!=null)
             {
                localStorage.setItem("user",JSON.stringify(findUser.email))
                state.user=findUser
                state.isAuthenticated=true
             }
        },
        logOut:(state)=>{
            localStorage.removeItem("user")
            state.user=null
            state.isAuthenticated=false
        }
        
    },
    extraReducers:(builder)=>{
        builder
        .addCase(fetchUsers.fulfilled,(state,action)=>{
            state.users=action.payload
        })
    }
})
export const selectAllUsers=(state)=>state.auth.users
export const selectLoginUser=(state)=>state.auth.user

export const {loginSuccess,logOut}=authSlice.actions

export default authSlice.reducer