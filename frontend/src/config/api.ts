// src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://invoice-generator-fix.onrender.com/';

// Debug: Log the API base URL to see what value it has
console.log('API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
