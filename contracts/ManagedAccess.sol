// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ManagedAccess {
    address public owner;

    address public manager;

    address[] public managers;
    mapping(address => bool) public isManager;
    mapping(address => bool) public isConfirmed;

    constructor(address _owner, address _manager) {
        owner = _owner;
        manager = _manager;
        managers.push(_manager);
        isManager[_manager] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not authorized");
        _;
    }

    modifier onlyManager() {
        require(
            msg.sender == manager,
            "You are not authorized to manage this contract"
        );
        _;
    }

    modifier onlyAllConfirmed() {
        require(isManager[msg.sender] == true, "You are not a manager");
        require(isConfirmed[msg.sender] == true, "Not all confirmed yet");
        for (uint256 i = 0; i < managers.length; i++) {
            require(isConfirmed[managers[i]] == true, "Not all confirmed yet");
        }
        _;
    }

    function addManager(address account) external onlyOwner {
        require(
            account != address(0) && !isManager[account],
            "Invalid manager"
        );
        managers.push(account);
        isManager[account] = true;
    }

    function confirm() external {
        require(isManager[msg.sender], "You are not a manager");
        isConfirmed[msg.sender] = true;
    }
}
