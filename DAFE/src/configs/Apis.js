import axios from "axios";
import cookie from 'react-cookies'

// Prefer env var if provided, fallback to local manage-product server
const BASE_URL = (process.env.REACT_APP_API_BASE || 'http://localhost:4000/api').replace(/\/$/, "");

export const endpoints = {
    // Catalog
    'categories': '/categories',
    'courses': '/courses',
    'courseDetail': (id) => `/courses/${id}`,
    'classesByCourse': (courseId) => `/courses/${courseId}/classes`,

    // Auth
    'login': '/login',
    'register': '/register',
    'verifyEmail': (token) => `/verify-email?token=${token}`,
    'sendOtp': '/send-otp',
    'verifyOtp': '/verify-otp',
    'resetPassword': '/reset-password',
    'checkOtp': '/check-otp',
    'profile': '/me',
    'updateProfile': '/me/update',

    // Cart
    'cart': '/cart',

    // Checkout
    'checkoutPreview': '/checkout/preview',
    'placeOrder': '/checkout/place-order',
    'createPayment': '/checkout/create-payment',

    // Learning
    'myEnrollments': '/me/enrollments',
    'classDetail': (classId) => `/classes/${classId}`,

    // Livestream
    'debugLivestream': '/livestream/debug',
    'myLivestreams': '/livestream/classes',
    'classLivestream': (classId) => `/livestream/class/${classId}`,
    'activeLivestreams': '/livestream/active',

    // Class Transfer
    'transferRequest': '/transfer-request',
    'availableClasses': (classId) => `/available-classes/${classId}`,
    'transferRequestDetail': (enrollmentId) => `/transfer-request/${enrollmentId}`,
    'cancelTransferRequest': (enrollmentId) => `/transfer-request/${enrollmentId}`,
};

export const authApis = () => axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Bearer ${cookie.load('token')}`
    }
});

export const VNpayApis = () => axios.create({
    baseURL: 'http://localhost:8080/ApartManagement/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

export default axios.create({
    baseURL: BASE_URL
});