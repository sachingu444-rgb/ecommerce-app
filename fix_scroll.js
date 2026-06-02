const fs = require('fs');
const file = 'app/seller/edit-product.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/SafeAreaView style=\{\{ flex: 1, height: "100%",/g, 'SafeAreaView style={{ flex: 1,');

fs.writeFileSync(file, code);
console.log('Fixed edit-product scroll issue');
