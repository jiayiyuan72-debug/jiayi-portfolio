require('@/../setup'); // no
process.env.NODE_ENV='production';
const path = require('path');
// 使用项目 tsx 加载 TSX
const { register } = require('esbuild-register') || null;
