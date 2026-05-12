import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' 
import App from './App' // تم تصحيح المسار ليتناسب مع هيكلية مشروعك
import { AuthProvider } from './auth/AuthContext'
import './index.css'   // تأكد من وجود ملف index.css في نفس مجلد src

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* تغليف التطبيق بـ BrowserRouter ضروري جداً لعمل useNavigate ومنع الـ White Screen */}
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)