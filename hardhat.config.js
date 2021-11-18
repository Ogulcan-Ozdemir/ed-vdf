// require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
module.exports = {
  solidity: "0.6.1",
  // solidity: "0.7.3",
  mocha:{
      timeout: 300_000,
      reporter: 'mochawesome',
  }
};
