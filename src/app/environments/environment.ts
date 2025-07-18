export const environment = {
  production: import.meta.env.PROD,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseKey: import.meta.env.VITE_SUPABASE_KEY as string,
  rawgApiKey: import.meta.env.VITE_RAWG_API_KEY as string
};
