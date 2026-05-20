import { useEffect, useState } from "react"
import { useDispatch,useSelector } from "react-redux"
import { fetchUsers, loginSuccess, selectAllUsers } from "../features/auth/authSlice"
import { useNavigate } from "react-router"
import { selectLoginUser } from "../features/auth/authSlice"
const LoginPage=()=>{
    const dispatch=useDispatch()
    const navigate=useNavigate()
    const [user,setUser]=useState({
        email:"",
        password:""
    })
    const users=useSelector(selectAllUsers)
    const loginUser=useSelector(selectLoginUser)

    useEffect(()=>{
        dispatch(fetchUsers())
    },[dispatch])
    function handleLogin(e)
    {
        e.preventDefault();
        console.log(users)
        dispatch(loginSuccess(user))
        loginUser?? navigate("/admin")
       
    }
    return(
        <>
        <div className="container">
            <div className="row">
                <div className="col-md-2">

                </div>
                <div className="col-md-6">
                    <form action="">
                        <div className="mt-3">
                            <label htmlFor="" className="form-label">Email</label>
                            <input type="text" name="" id="" className="form-control" onChange={(e)=>setUser({...user,email:e.target.value})} value={user.email}/>
                        </div>
                        <div className="mt-3">
                            <label htmlFor="" className="form-label">Password</label>
                            <input type="password" name="" id="" className="form-control" onChange={(e)=>setUser({...user,password:e.target.value})} value={user.password}/>
                        </div>
                        <div className="mt-3">
                            <button className="btn btn-dark" onClick={(e)=>handleLogin(e)}>Login</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        </>
    )
}
export default LoginPage