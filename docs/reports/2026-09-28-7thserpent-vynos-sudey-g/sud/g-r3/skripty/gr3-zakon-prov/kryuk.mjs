// Регистрация крюка: перечень замен — из переменной окружения ZNAK_MUTACIYA (её ставит запускатель через spawnSync).
import { register } from 'node:module';

register('./kryuk-load.mjs', import.meta.url, { data: process.env.ZNAK_MUTACIYA ?? '' });
