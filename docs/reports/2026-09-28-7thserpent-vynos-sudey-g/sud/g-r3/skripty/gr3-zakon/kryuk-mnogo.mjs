import { register } from 'node:module';

register('./kryuk-mnogo-load.mjs', import.meta.url, { data: process.env.ZNAK_ZAMENY ?? '' });
