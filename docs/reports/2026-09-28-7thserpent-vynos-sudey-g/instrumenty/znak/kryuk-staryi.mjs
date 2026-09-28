// Регистрация крюка прежней редакции: путь к её тексту — в ZNAK_STARYI (ставит sverka-verdiktov.mjs).
import { register } from 'node:module';

register('./kryuk-staryi-load.mjs', import.meta.url, { data: process.env.ZNAK_STARYI ?? '' });
