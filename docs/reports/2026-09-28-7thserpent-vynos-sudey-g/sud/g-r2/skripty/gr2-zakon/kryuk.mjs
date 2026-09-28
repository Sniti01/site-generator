// Регистрация крюка: мутация tools/znak.mjs — из переменной окружения GR2_MUT (её ставит прогонщик через env spawn).
import { register } from 'node:module';

register('./kryuk-load.mjs', import.meta.url, { data: process.env.GR2_MUT ?? '' });
