const fs = require('fs');
const path = require('path');
fs.writeFileSync(path.join(__dirname, '../public/test.txt'), 'hello');
console.log('Test file written');
