import Knex from 'knex';
import path from 'path';
import { config } from './index';

export const knexConfig = {
  development: {
    client: 'pg',
    connection: config.DATABASE_URL,
    migrations: {
      directory: path.join(__dirname, '../../migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, '../../seeders'),
      extension: 'ts',
    },
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: config.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    },
    migrations: {
      directory: path.join(__dirname, '../../migrations'),
      extension: 'js',
    },
    seeds: {
      directory: path.join(__dirname, '../../seeders'),
      extension: 'js',
    },
  },
};

const environment = config.NODE_ENV || 'development';
export const knex = Knex(knexConfig[environment as keyof typeof knexConfig]);

export default knex;
