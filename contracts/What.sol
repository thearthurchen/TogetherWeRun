pragma solidity ^0.6.12;

contract What {

    function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

    function getInviteCode() external view returns (bytes2) {
        uint256 randomness = 1;
        return bytes2(keccak256(abi.encodePacked(msg.sender, randomness)));
    }

}
