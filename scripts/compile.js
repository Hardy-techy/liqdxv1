const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contractPath = path.resolve(__dirname, 'contracts', 'PrivateMorphoVault.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'PrivateMorphoVault.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
  },
};

console.log("Compiling contract...");
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  output.errors.forEach((err) => console.error(err.formattedMessage));
  if (output.errors.some(e => e.severity === 'error')) {
      process.exit(1);
  }
}

const contract = output.contracts['PrivateMorphoVault.sol']['PrivateMorphoVault'];
const compiledDir = path.resolve(__dirname, 'compiled');

if (!fs.existsSync(compiledDir)) {
    fs.mkdirSync(compiledDir);
}

fs.writeFileSync(
  path.resolve(compiledDir, 'PrivateMorphoVault.json'),
  JSON.stringify({
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
  }, null, 2)
);

console.log("Compiled successfully!");
