pragma solidity ^0.6.1;
pragma experimental ABIEncoderV2;
// SPDX-License-Identifier: UNLICENSED

contract ED_VDF {

    string public name = 'ED_VDF';
    string public STATUS = 'NO_INIT';

    address payable public SENDER;
    string[] SECRET_SHARER_PARTICIPANTS;
    string public RECIPIENT;

    uint256 public N;
    uint256 public Time;
    uint256 public x;
    string public encryptedMessage;

    uint256 public INIT_TIMESTAMP = 0 seconds;

    event SETUP(uint256 _x);
    event EARLY_DECRYPTION_SETUP(string[] participants);
    event EVAL(uint256 N, uint256 T, uint256 _x);
    event VERIFY(address from, uint256 _EvalPrivateParameter, uint256 _EvalProof);

    constructor() public {
        SENDER = msg.sender;
        STATUS = 'INIT';
    }

    function Setup(uint256 _N, uint256 _T, string memory _RECIPIENT) public
    {
        require(SENDER == msg.sender);
        require(keccak256(abi.encodePacked(STATUS)) == keccak256('INIT'), 'ED_VDF should be at INIT status before Setup phase');

        INIT_TIMESTAMP = block.timestamp;

        STATUS = 'SETUP';
        Time = _T;
        N = _N;
        RECIPIENT = _RECIPIENT;

        x = uint256(blockhash(block.number - 1)) % N;

        emit SETUP(x);
    }

    function EarlyDecryptionSetup(string[] memory _SECRET_SHARER_PARTICIPANTS, string memory _encryptedMessage) public
    {
        require(SENDER == msg.sender);
        require(keccak256(abi.encodePacked(STATUS)) == keccak256('SETUP'), 'ED_VDF should be at SETUP status before EarlyDecryptionSetup phase');
        encryptedMessage = _encryptedMessage;
        SECRET_SHARER_PARTICIPANTS = _SECRET_SHARER_PARTICIPANTS;
        STATUS = 'EARLY_DECRYPTION_SETUP';
        emit EARLY_DECRYPTION_SETUP(SECRET_SHARER_PARTICIPANTS);
        Eval();
    }

    function Eval() private
    {
        require(keccak256(abi.encodePacked(STATUS)) == keccak256('EARLY_DECRYPTION_SETUP'), 'ED_VDF should be at EARLY_DECRYPTION_SETUP status before Eval phase');
        STATUS = 'EVAL';
        emit EVAL(N, Time, x);
    }

    function Verify(uint256 EvalPrivateParameter, uint256 EvalProof) public
    {
        require(keccak256(abi.encodePacked(STATUS)) == keccak256('EVAL'), 'ED_VDF should be at EVAL status before Verify phase');
        require(EvalPrivateParameter <= N &&  EvalProof <= N);
        STATUS = 'VERIFY';
        emit VERIFY(msg.sender, EvalPrivateParameter, EvalProof);
    }

    function get_SECRET_SHARER_PARTICIPANTS() public view returns (string[] memory) {
        return SECRET_SHARER_PARTICIPANTS;
    }

    function HPrime(uint256 _N, uint256 _T, uint256 _X, uint256 _Y)  view private returns (uint256)
    {
        uint256 p = uint256(keccak256(abi.encodePacked(_N,_T,_X,_Y))) >> 3;
        if (p%2 == 0) p = p+1;
        while (true) {
            if (check_probable_prime(p)) {
                return p;
            }
            p = p+2;
        }
    }

    uint256[] private FIRST_256_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223, 1229, 1231, 1237, 1249, 1259, 1277, 1279, 1283, 1289, 1291, 1297, 1301, 1303, 1307, 1319, 1321, 1327, 1361, 1367, 1373, 1381, 1399, 1409, 1423, 1427, 1429, 1433, 1439, 1447, 1451, 1453, 1459, 1471, 1481, 1483, 1487, 1489, 1493, 1499, 1511, 1523, 1531, 1543, 1549, 1553, 1559, 1567, 1571, 1579, 1583, 1597, 1601, 1607, 1609, 1613, 1619];

    function check_probable_prime(uint256 p) view private returns (bool)
    {

        for (uint256 i=0; i < FIRST_256_PRIMES.length; i++){
            uint256 selectedPrime = FIRST_256_PRIMES[i];
            if (p % selectedPrime == 0) {
                if (p == selectedPrime){
                    return true;
                }
                return false;
            }
        }

        return miller_rabin(p, 20);
    }

    function miller_rabin(uint256 p, uint256 tests) view private returns (bool)
    {
        (uint256 even, uint256 s, uint256 r) = (p-1, 0, 1);
        while (even%2 == 0) {
            even = even/2;
            s = s+1;
        }
        r=even;

        bytes32 B = blockhash(block.number - 1);
        for (uint256 i=0; i<tests; i++) {
            uint256 a = (uint256(keccak256(abi.encodePacked(B,i))) % (p-3)) + 2;
            uint256 y = expmod(a,r,p);
            if (y != 1 && y != p-1){
                uint256 j = 1;
                while (j <= s-1 && y != p-1){
                    y = expmod(y,2,p);
                    if (y == 1)    return false;
                    j = j+1;
                }
                if (y != p-1)    return false;
            }
        }
        return true;
    }

    function expmod(uint256 Base, uint256 Exponent, uint256 Modulus) pure private returns (uint256)
    {
        (uint256 a, uint256 b, uint256 e) = (Base, 1, Exponent);
        if (e==0) return b;
        if (e%2 == 1) b=a;
        e = e>>1;
        while (e>0)
        {
            a = mulmod(a,a,Modulus);
            if (e%2 == 1) b = mulmod(a,b,Modulus);
            e = e>>1;
        }
        return b;
    }

    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

}