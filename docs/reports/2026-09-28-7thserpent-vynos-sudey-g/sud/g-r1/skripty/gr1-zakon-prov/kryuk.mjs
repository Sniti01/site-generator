// Регистрация крюка загрузчика: мутация tools/znak.mjs в памяти (JSON из переменной окружения PROV_MUTACIYA).
import { register } from 'node:module';

register('./kryuk-load.mjs', import.meta.url, { data: process.env.PROV_MUTACIYA ?? '' });
