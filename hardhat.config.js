// require("@nomiclabs/hardhat-waffle");
// require("@nomiclabs/hardhat-ganache");
require("@nomiclabs/hardhat-ethers");
// const pk = process.env.dapk;
module.exports = {
    solidity: "0.6.1",
    // solidity: "0.7.3",
    networks: {
        // hardhat: {
        //     chainId: 1337
        // },
        // ropsten: {
        //     url: "https://ropsten.infura.io/v3/abcd123",
        //     account: [`0x${pk}`]
        // },
        // mainnet: {
        //     url: `https://mainnet.infura.io/v3/abcd123`,
        //     account: [`0x${pk}`]
        // },
    },
    mocha: {
        timeout: 300_000,
        reporter: 'mochawesome',
    }
};
