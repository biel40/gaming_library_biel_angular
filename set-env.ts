import { config } from 'dotenv';
import { writeFileSync, mkdirSync } from 'fs';

config();

const targetPath = './src/app/environments/environment.ts';
const targetPathProd = './src/app/environments/environment.prod.ts';

mkdirSync('./src/app/environments', { recursive: true });

const envConfigFile = `export const environment = {
  production: false,
  allowRegistration: true,
  supabaseUrl: '${process.env['VITE_SUPABASE_URL'] || ''}',
  supabaseKey: '${process.env['VITE_SUPABASE_KEY'] || ''}',
  rawgApiKey: '${process.env['VITE_RAWG_API_KEY'] || ''}'
};
`;

const envConfigFileProd = `export const environment = {
  production: true,
  allowRegistration: false,
  supabaseUrl: '${process.env['VITE_SUPABASE_URL'] || ''}',
  supabaseKey: '${process.env['VITE_SUPABASE_KEY'] || ''}',
  rawgApiKey: '${process.env['VITE_RAWG_API_KEY'] || ''}'
};
`;

writeFileSync(targetPath, envConfigFile);
writeFileSync(targetPathProd, envConfigFileProd);

console.log('✅ Environment files generated successfully!');
console.log('📋 Loaded variables:');
console.log('  - SUPABASE_URL:', process.env['VITE_SUPABASE_URL'] ? '✓' : '✗');
console.log('  - SUPABASE_KEY:', process.env['VITE_SUPABASE_KEY'] ? '✓' : '✗');
console.log('  - RAWG_API_KEY:', process.env['VITE_RAWG_API_KEY'] ? '✓' : '✗');
