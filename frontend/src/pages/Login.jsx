import { useState } from "react"
import { useDispatch } from "react-redux"
import { loginUser } from "../features/auth/authSlice"

function Login() {

   const dispatch = useDispatch()

   const [formData, setFormData] = useState({
      email: "",
      password: "",
   })

   const handleSubmit = (e) => {
      e.preventDefault()

      dispatch(loginUser(formData))
   }

   return (
      <form onSubmit={handleSubmit}>

         <input
            type="email"
            placeholder="Email"
            onChange={(e)=>
              setFormData({
                ...formData,
                email:e.target.value
              })
            }
         />

         <input
            type="password"
            placeholder="Password"
            onChange={(e)=>
              setFormData({
                ...formData,
                password:e.target.value
              })
            }
         />

         <button type="submit">
            Login
         </button>

      </form>
   )
}

export default Login