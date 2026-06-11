import { NamingEngine } from './src/physics/NamingEngine';
console.log('--- TEST START ---');
const formula = 'SF6';
const result = NamingEngine.generateName(formula);
console.log(`Input: ${formula}`);
console.log(`Output: ${result}`);
console.log('--- TEST END ---');
