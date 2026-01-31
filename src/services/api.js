// src/services/api.js
import axios from "axios";
import { auth } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(true);
    
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
