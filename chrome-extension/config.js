// Configuration for Later AI Chrome Extension
const CONFIG = {
  // API endpoints
  API_BASE_URL: 'https://later-ai-backend-d2f9.onrender.com',
  DASHBOARD_URL: 'https://later-ai-swart.vercel.app',
  
  // Supabase configuration
  SUPABASE_URL: 'https://hqxfsonpjxnfafhwygwv.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxeGZzb25wanhuZmFmaHd5Z3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTY1MDQsImV4cCI6MjA3MTkzMjUwNH0.eBMel__WsYsStL1_949eVRM2lei-91F2yfnWfWKDswI',
  
  // Development overrides (set to true for local development)
  USE_LOCAL: false,
  LOCAL_API_URL: 'http://localhost:3001',
  LOCAL_DASHBOARD_URL: 'http://localhost:5173'
};

// Export for use in extension scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}