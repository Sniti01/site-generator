// Регистрация крюка: мутация — из переменной окружения ZNAK_MUTACIYA (её ставит mutacii-znak.mjs).
import { register } from 'node:module';

register('./kryuk-znak-load.mjs', import.meta.url, { data: process.env.ZNAK_MUTACIYA ?? '' });
