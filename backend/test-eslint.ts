// This is a test file for ESLint
const unusedVariable = 'This should trigger an ESLint warning';

function testFunction() {
  // This should trigger an ESLint error for no-unused-expressions
  unusedVariable;

  return 'test';
}

export default testFunction;
