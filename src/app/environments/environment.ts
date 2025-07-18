export const environment = {
  production: false,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://krgffsbmwzrsdgdjdqap.supabase.co',
  supabaseKey: import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZ2Zmc2Jtd3pyc2RnZGpkcWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMTA3NjMsImV4cCI6MjA1Nzc4Njc2M30.FDqSOP6umhZv_AKpmZscL6x2EAkUy2V1Ga0Mwar5VlM',
  rawgApiKey: import.meta.env.VITE_RAWG_API_KEY || '4afc7908a8e64f72afdfc0c10d666dcc'
};
