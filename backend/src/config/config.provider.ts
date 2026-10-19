import { ConfigService } from '@nestjs/config';
import { AppConfig } from './environment';

export const APP_CONFIG = 'CONFIG';
export const appConfigProvider = {
  provide: APP_CONFIG,
  inject: [ConfigService],
  useFactory: (config: ConfigService<AppConfig, true>) => ({
    port: config.get('port', { infer: true }),
    frontendOrigin: config.get('frontendOrigin', { infer: true }),
    jwtSecret: config.get('jwtSecret', { infer: true }),
    portfolioSlug: config.get('portfolioSlug', { infer: true }),
    nodeEnv: config.get('nodeEnv', { infer: true }),
    mediaStorageDirectory: config.get('mediaStorageDirectory', { infer: true }),
  }),
};
