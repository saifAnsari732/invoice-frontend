const BACKEND_URL = import.meta.env.VITE_BACKEND_SERVER || 'https://invoice-backend-f6fz.onrender.com/';

export const API_BASE_URL = BACKEND_URL + 'api/';
export const BASE_URL = BACKEND_URL;
export const DOWNLOAD_BASE_URL = BACKEND_URL + 'download/';

export const WEBSITE_URL = import.meta.env.PROD
  ? 'http://cloud.idurarapp.com/'
  : 'http://localhost:3000/';
export const ACCESS_TOKEN_NAME = 'x-auth-token';

export const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL;

//  console.log(
//    '🚀 Welcome to IDURAR ERP CRM! Did you know that we also offer commercial customization services? Contact us at hello@idurarapp.com for more information.'
//  );
