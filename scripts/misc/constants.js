const Time_Unit_1 = 2**16 + 2**15 + 2**14 + 2**10 + 2**7 + 2**6 + 2**4 + 7;
const Time_Unit_10 = 10 * Time_Unit_1;
const Time_Unit_80 = 6 * Time_Unit_10;

module.exports = {
    TIME: {
        "10s": Time_Unit_1,
        "50s": Time_Unit_10,
        "1m": Time_Unit_80,
    },
    CONTRACT_NAME : "ED_VDF",
    EVENTS: {
        SETUP: "SETUP(uint256)",
        EARLY_DECRYPTION_SETUP: "EARLY_DECRYPTION_SETUP(string[])",
        EARLY_DECRYPTION: "EARLY_DECRYPTION()",
        EVAL: "EVAL(uint256,uint256,uint256)",
        VERIFY: "VERIFY(address,uint256,uint256)",
    },
    PHASES: {
        SETUP: "SETUP",
        EARLY_DECRYPTION_SETUP: "EARLY_DECRYPTION_SETUP",
        EVAL: "EVAL",
        VERIFY: "VERIFY",
    }
}