const babel = require('@babel/core');
const path = require('path');

const code1 = `const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;`;
const code2 = `const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;`;

const options = {
  filename: path.join(__dirname, 'src', 'lib', 'supabase.ts'),
  presets: ['babel-preset-expo'],
  plugins: ['@babel/plugin-transform-typescript']
};

console.log("=== Testing with non-null assertion (!) ===");
console.log("Input: ", code1);
const res1 = babel.transformSync(code1, options);
console.log("Output: ", res1.code);
console.log("");

console.log("=== Testing without non-null assertion ===");
console.log("Input: ", code2);
const res2 = babel.transformSync(code2, options);
console.log("Output: ", res2.code);
