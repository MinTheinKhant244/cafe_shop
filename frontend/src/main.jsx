import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'chart.js'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { DataTable } from 'simple-datatables'
import './assets/css/styles.css'
import { BrowserRouter } from 'react-router'
import { Provider } from 'react-redux'
import store from './app/store.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    
    <BrowserRouter>

      <Provider store={store}>
          <App />
      </Provider>
    
    </BrowserRouter>
   
  </React.StrictMode>,
)
