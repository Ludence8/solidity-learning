# @version ^0.3.0
# @license MIT
INIT_REWARD: constant(uint256) = 1 * 10 ** 18

interface IMyToken:
    def transfer(_amount:uint256, _to:address): nonpayable
    def transferFrom(_owner:address, _to:address, _amount:uint256): nonpayable
    def mint(_amount:uint256, _to:address): nonpayable

event Staked:
    _owner: indexed(address)
    _amount: uint256

event Withdraw:
    _amount: uint256
    _to: indexed(address)

staked: public(HashMap[address, uint256])
totalStaked: public(uint256)

stakedToken: IMyToken

rewardPerBlock: uint256

lastClaimBlock : HashMap[address, uint256]
owner: public(address)
manager: public(address)

@external
def __init__(_stakedToken: IMyToken):
    self.stakedToken = _stakedToken
    self.rewardPerBlock = INIT_REWARD
    self.owner = msg.sender
    self.manager = msg.sender

@internal
def onlyOwner(_owner:address):
    assert self.owner == _owner, "You are not authorized"

@internal
def onlyManager(_manager:address):
    assert self.manager == _manager, "You are not authorized to manage this contract"

@external
def setRewardPerBlock(_amount: uint256):
    self.onlyManager(msg.sender)
    self.rewardPerBlock = _amount

@internal
def updateReward(_to: address):
    if self.staked[_to] > 0:
        blocks: uint256 = block.number - self.lastClaimBlock[_to]
        reward: uint256 = self.rewardPerBlock * blocks * self.staked[_to] / self.totalStaked
        self.stakedToken.mint(reward, _to)

    self.lastClaimBlock[_to] = block.number


@external
def stake(_amount: uint256):
    assert _amount > 0, "cannot stake 0 amount"
    self.updateReward(msg.sender)
    self.stakedToken.transferFrom(msg.sender, self, _amount)
    self.staked[msg.sender] += _amount
    self.totalStaked += _amount
    log Staked(msg.sender, _amount)


@external
def withdraw(_amount: uint256):
    assert self.staked[msg.sender] >= _amount, "insufficient staked balance"
    self.updateReward(msg.sender)
    self.stakedToken.transfer(_amount, msg.sender)
    self.staked[msg.sender] -= _amount
    self.totalStaked -= _amount
    log Withdraw(_amount, msg.sender)
    