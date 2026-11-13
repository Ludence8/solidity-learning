// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NativeBank {
    mapping(address => uint256) public balanceOf;
    bool lock;

    modifier noreentrancy() {
        require(!lock, "is now working on");
        lock = true;
        _;
        lock = false;
    }

    function withdraw() external noreentrancy {
        //require(!lock, "is now working on");
        //lock = true;

        uint256 balance = balanceOf[msg.sender];
        require(balance > 0, "insufficient balance");

        //balanceOf[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "failed to send native token");

        balanceOf[msg.sender] = 0;
        //lock = false;
    }

    receive() external payable {
        balanceOf[msg.sender] += msg.value;
    }
}
