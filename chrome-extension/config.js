// Configuration for Later AI Chrome Extension
const CONFIG = {
  // API endpoints
  API_BASE_URL: 'https://later-ai-backend-d2f9.onrender.com',
  DASHBOARD_URL: 'https://later-ai.vercel.app',
  
  // Supabase configuration
  SUPABASE_URL: 'https://zsjlalcpnwbuqxrdryyi.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzamxhbGNwbndidXF4cmRyeXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzODgxNDksImV4cCI6MjA0Njk2NDE0OX0.VcZ1ctdDgBW6Ej_9qJe_9fKjaqAwRjE4f9F_7gvP4h0',
  
  // Development overrides (set to true for local development)
  USE_LOCAL: false,
  LOCAL_API_URL: 'http://localhost:3001',
  LOCAL_DASHBOARD_URL: 'http://localhost:5173'
};

// Export for use in extension scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}