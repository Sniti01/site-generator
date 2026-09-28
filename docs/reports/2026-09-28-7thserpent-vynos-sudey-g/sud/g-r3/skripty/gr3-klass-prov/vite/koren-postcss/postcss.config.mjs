export default { plugins: [{ postcssPlugin: 'podmena', AtRule: { 'font-face': (r) => { if (/Bodoni Moda/.test(r.toString())) r.walkDecls('src', (d) => { d.value = "local('Georgia')"; }); } } }] };
