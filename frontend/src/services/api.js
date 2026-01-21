
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not defined");
}

console.log("🔗 API URL:", API_BASE_URL);
console.log("🌍 Environment:", import.meta.env.MODE);


// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    console.group('🔐 REQUEST INTERCEPTOR');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    console.log('Token exists:', !!token);
    
    if (token) {
     
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header set:', config.headers.Authorization?.substring(0, 50) + '...');
    } else {
      console.warn('⚠️ No token found in localStorage');
    }
    
    if (config.params) {
      console.log('📋 Query params:', config.params);
    }
    
    console.log('Final headers:', config.headers);
    console.groupEnd();
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    
    if (error.response) {
      console.group('❌ API ERROR');
      console.log('Status:', error.response.status);
      console.log('URL:', originalRequest.url);
      console.log('Method:', originalRequest.method);
      console.log('Detail:', error.response?.data?.detail);
      console.log('Had auth header:', !!originalRequest.headers?.Authorization);
      console.groupEnd();
    }
    
    if (error.response?.status === 403) {
      console.error('❌ 403 FORBIDDEN ERROR');
      console.error('   URL:', originalRequest.url);
      console.error('   Message:', error.response?.data?.detail);
      
     
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          console.log('🔄 Attempting token refresh...');
          const refreshResponse = await api.post('/auth/refresh');
          const { access_token } = refreshResponse.data;
          
          localStorage.setItem('token', access_token);
          api.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
          originalRequest.headers.Authorization = 'Bearer ' + access_token;
          
          console.log('✅ Token refreshed! Retrying request...');
          return api(originalRequest);
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
  
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        const { access_token, refresh_token } = response.data;
        localStorage.setItem('token', access_token);
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
        }

        api.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
        originalRequest.headers.Authorization = 'Bearer ' + access_token;

        processQueue(null, access_token);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_picture');

        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => {
    return api.post('/auth/register', userData);
  },
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },
  refresh: () => {
    return api.post('/auth/refresh');
  },
  getGoogleAuthUrl: () => {
    return api.get('/auth/google/url');
  },
  googleCallback: (code) => {
    return api.post('/auth/google/callback', { code });
  },
  forgotPassword: (email) => {
    return api.post('/auth/forgot-password', { email });
  },
  resetPassword: (token, newPassword) => {
    return api.post('/auth/reset-password', { token, new_password: newPassword });
  },
  verifyResetToken: (token) => {
    return api.get(`/auth/verify-reset-token/${token}`);
  }
};

// Folders API
export const foldersAPI = {
  getAll: (parentId = null) => {
    const params = parentId ? { parent_id: parentId } : {};
    return api.get('/folders/', { params });
  },
  create: (name, parentId = null) => {
    return api.post('/folders/', { name, parent_id: parentId });
  },
  update: (folderId, name) => {
    return api.put(`/folders/${folderId}`, { name });
  },
  delete: (folderId) => {
    return api.delete(`/folders/${folderId}`);
  },
  permanentDelete: (folderId) => {
    return api.delete(`/folders/${folderId}/permanent`);
  },
  getTrashed: () => {
    return api.get('/folders/trash/all');
  },
  restore: (folderId) => {
    return api.post(`/folders/${folderId}/restore`);
  },
  search: (query) => {
    return api.get('/folders/search', { params: { q: query } });
  },
  getPath: (folderId) => {
    return api.get(`/folders/${folderId}/path`);
  },
};

// Files API
export const filesAPI = {
  getAll: (folderId = null, sortBy = 'created_at', sortOrder = 'desc', page = 1, limit = 50) => {
    const params = { sort_by: sortBy, sort_order: sortOrder, page, limit };
    
    
    if (folderId !== null && folderId !== undefined) {
      params.folder_id = folderId;
    }
    
    console.log('📂 filesAPI.getAll params:', params);
    return api.get('/files/', { params });
  },
  
      upload: (file, folderId, onProgress = null) => {
      const formData = new FormData();
      formData.append('file', file);
      
     
      if (folderId !== null && folderId !== undefined) {
        formData.append('folder_id', folderId);
      }
    
      return api.post('/files/upload', formData, {
       
        params: folderId ? { folder_id: folderId } : {}, 
        onUploadProgress: onProgress,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
  
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },
  
  getDownloadUrl: (fileId) => {
    return api.get(`/files/${fileId}`);
  },
  delete: (fileId) => {
    return api.delete(`/files/${fileId}`);
  },
  permanentDelete: (fileId) => {
    return api.delete(`/files/${fileId}/permanent`);
  },
  toggleStar: (fileId) => {
    return api.post(`/files/${fileId}/star`);
  },
  getStarred: () => {
    return api.get('/files/starred/all');
  },
  getTrashed: () => {
    return api.get('/files/trash/all');
  },
  restore: (fileId) => {
    return api.post(`/files/${fileId}/restore`);
  },
  getPreview: (fileId) => {
    return api.get(`/files/${fileId}/preview`);
  },
  search: (query, filters = {}) => {
    const params = {};
    if (query && query.trim()) {
      params.q = query;
    }
    if (filters.fileType && filters.fileType.trim()) {
      params.file_type = filters.fileType;
    }
    if (filters.minSize && filters.minSize > 0) {
      params.min_size = parseInt(filters.minSize);
    }
    if (filters.maxSize && filters.maxSize > 0) {
      params.max_size = parseInt(filters.maxSize);
    }
    if (filters.sortBy) {
      params.sort_by = filters.sortBy;
    }
    if (filters.sortOrder) {
      params.sort_order = filters.sortOrder;
    }

    return api.get('/files/search', { params });
  },
};

// Version History API
export const versionsAPI = {
  getFileVersions: (fileId) => {
    return api.get(`/versions/file/${fileId}`);
  },
  restoreVersion: (fileId, versionNumber) => {
    return api.post(`/versions/file/${fileId}/restore/${versionNumber}`);
  }
};

// Activity Logs API
export const activitiesAPI = {
  getUserActivities: (limit = 50) => {
    return api.get('/activities/', { params: { limit } });
  },
  getResourceActivities: (resourceType, resourceId, limit = 20) => {
    return api.get(`/activities/${resourceType}/${resourceId}`, { params: { limit } });
  },
  deleteActivity: (activityId) => {
    return api.delete(`/activities/${activityId}`);
  },
  bulkDelete: (activityIds) => {
    return api.post('/activities/bulk-delete', { activity_ids: activityIds });
  },
  clearAll: () => {
    return api.delete('/activities/clear/all');
  }
};

// Storage API
export const storageAPI = {
  getUsage: () => {
    return api.get('/files/');
  }
};

export const tagsAPI = {
  getAll: () => {
    return api.get('/tags/');
  },
  create: (tagData) => {
    return api.post('/tags/', tagData);
  },
  update: (tagId, tagData) => {
    return api.put(`/tags/${tagId}`, tagData);
  },
  delete: (tagId) => {
    return api.delete(`/tags/${tagId}`);
  },
  addToFile: (fileId, tagIds) => {
    return api.post(`/tags/file/${fileId}/tags`, { tag_ids: tagIds });
  },
  getFilesByTag: (tagId) => {
    return api.get(`/tags/${tagId}/files`);
  }
};

export const sharesAPI = {
  createShare: (fileId, folderId, email, role) => {
    return api.post('/shares/', {
      file_id: fileId || null,
      folder_id: folderId || null,
      shared_with_email: email,
      role: role
    });
  },
  getSharedWithMe: () => {
    return api.get('/shares/shared-with-me');
  },
  getMyShares: () => {
    return api.get('/shares/my-shares');
  },
  deleteShare: (shareId) => {
    return api.delete(`/shares/${shareId}`);
  },
  createPublicLink: (fileId, password = null, expiresInDays = null) => {
    return api.post('/shares/public-link', {
      file_id: fileId,
      password: password,
      expires_in_days: expiresInDays
    });
  },
  getPublicLinks: () => {
    return api.get('/shares/public-links');
  },
  deletePublicLink: (linkId) => {
    return api.delete(`/shares/public-link/${linkId}`);
  },
  accessPublicLink: (token, password = null) => {
    const params = password ? { password } : {};
    return api.get(`/shares/public/${token}`, { params });
  },
};

export default api;