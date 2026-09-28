// Регистрация крюка: мутация — из переменной окружения GR2P_MUT (её ставит mutacii.mjs в env дочернего процесса).
import { register } from 'node:module';

register('./kryuk-load.mjs', import.meta.url, { data: process.env.GR2P_MUT ?? '' });
