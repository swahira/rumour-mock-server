const aedesLib = require('aedes');
const aedes = new aedesLib.Aedes();
console.log(aedes.handle ? "HAS HANDLE" : "NO HANDLE");
