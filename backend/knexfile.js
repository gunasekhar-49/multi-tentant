import { knexConfig } from './src/config/database';
import { config } from './src/config';

const environment = config.NODE_ENV || 'development';

module.exports = knexConfig[environment as keyof typeof knexConfig];
