import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./components/Home";
import CourseList from "./components/CourseList";
import CourseDetail from "./components/CourseDetail";
import Cart from "./components/Cart";
import Learning from "./components/Learning";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

import { MyInvoiceContext, MyUserContext, AuthProvider } from "./configs/Contexts";
import { useReducer } from "react";


import Login from "./components/Login";
import Register from "./components/Register";
import VerifyEmail from "./components/VerifyEmail";
import VerifyOtp from "./components/VerifyOtp";
import MyUserReducer from "./reducers/MyUserReducer";
import InvoiceReducer from "./reducers/MyInvoiceReducer";
import Profile from "./components/Profile";
import ChangePassword from "./components/ChangePassword";
import InvoicePage from "./components/Invoice";
import PaymentMethodPage from "./components/PaymentMothod";
import UploadTransferPage from "./components/UyNhiem";
import ComplaintForm from "./components/ComplaintForm";
import MyLocker from "./components/myLocker";

import VNPayReturnPage from './components/VnpayReturn';
// Legacy pages not used for language site are kept but not routed
// import CardList from './components/CardList';
// import VehicleCard from './components/VehicleCard';
// import SurveyDetail from './components/SurveyDetail';
// import SurveyList from './components/SurveyList';


const App = () => {
  let [user, dispatch] = useReducer(MyUserReducer, null);
  let [invoice, dispatchInvoice] = useReducer(InvoiceReducer, null);

  const handleLogout = () => {
    dispatch({ type: "logout" });
  };

  return (
    <AuthProvider>
      <MyUserContext.Provider value={[user, dispatch]}>
        <MyInvoiceContext.Provider value={[invoice, dispatchInvoice]}>
          <BrowserRouter>
            <div className="d-flex">
              <Header onLogout={handleLogout} />

              {/* Main content area */}
              <div className="flex-grow-1 p-3">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/verify-otp" element={<VerifyOtp />} />
                  <Route path="/courses" element={<CourseList />} />
                  <Route path="/courses/:id" element={<CourseDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/learning" element={<Learning />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/invoices" element={<InvoicePage />} />
                  <Route path="/paymentMethod" element={<PaymentMethodPage />} />
                  <Route path="/uyNhiem" element={<UploadTransferPage />} />
                  <Route path="/complaints" element={<ComplaintForm />} />
                  <Route path="/myLocker" element={<MyLocker />} />
                  <Route path="/payment-result" element={<VNPayReturnPage />} />
                  {false && <Route path="/vehicle-card" element={<div />} />}
                </Routes>

                <Footer />
              </div>
            </div>
            <ToastContainer 
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </BrowserRouter>
        </MyInvoiceContext.Provider>
      </MyUserContext.Provider>
    </AuthProvider>
  );
};
export default App;
