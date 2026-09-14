import axios from "axios";
import { API_BASE_URL } from "./ENDPOINTS";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("availlo_token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  // Let browser set multipart boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export const isApiConfigured = () => API_BASE_URL.length > 0;
