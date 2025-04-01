const config = {
    development: {
        apiUrl: 'http://localhost:8001'
    },
    production: {
        apiUrl: process.env.REACT_APP_API_URL || 'https://your-api-domain.com'
    }
};

const environment = process.env.NODE_ENV || 'development';
export const { apiUrl } = config[environment]; 