export const environment = {
  production: true,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: import.meta.env.VITE_SUPABASE_KEY || '',
  rawgApiKey: import.meta.env.VITE_RAWG_API_KEY || ''
};
