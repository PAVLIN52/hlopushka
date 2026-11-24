import { Global, Module } from '@nestjs/common';

import { APP_CONFIG, loadConfig } from './app.config';

/** Глобальный модуль конфигурации: `@Inject(APP_CONFIG)` доступен во всех модулях. */
@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig() }],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
