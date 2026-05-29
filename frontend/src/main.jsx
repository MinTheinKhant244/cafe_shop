import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
// import 'chart.js'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
// import { DataTable } from 'simple-datatables'
// import './assets/css/styles.css'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './app/store.js'
import "./index.css"
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    

      <Provider store={store}>
        <BrowserRouter>
         <App />
        </BrowserRouter>
      </Provider>
       
  </React.StrictMode>,
)
