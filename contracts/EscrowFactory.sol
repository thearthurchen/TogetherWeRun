// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/payment/escrow/RefundEscrow.sol';

contract EscrowFactory is Ownable {

    mapping (address => address) private _addressToEscrow;
    event RefundEscrowCreated(address owner);

    function getEscrow(address owner) external view returns (address) {
        return _addressToEscrow[owner];
    }

    function createEscrow(address host, address pactAddress) external onlyOwner {
        RefundEscrow escrow = new RefundEscrow(payable(msg.sender));
        escrow.transferOwnership(pactAddress);
        _addressToEscrow[host] = address(escrow);
        emit RefundEscrowCreated(host);
    }
}
