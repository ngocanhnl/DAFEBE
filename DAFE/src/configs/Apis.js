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
    'profile': '/me',
    'updateProfile': '/me/update',

    // Cart
    'cart': '/cart',

    // Checkout
    'checkoutPreview': '/checkout/preview',
    'placeOrder': '/checkout/place-order',

    // Learning
    'myEnrollments': '/me/enrollments',
    'classDetail': (classId) => `/classes/${classId}`,
};

export const authApis = () => axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Bearer ${cookie.load('token')}`
    }
});

export default axios.create({
    baseURL: BASE_URL
});