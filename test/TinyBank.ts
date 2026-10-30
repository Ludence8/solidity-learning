import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import { TinyBank, MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TinyBank", () => {
  let signers: HardhatEthersSigner[];
  let myTokenC: MyToken;
  let tinyBankC: TinyBank;
  beforeEach(async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);
    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      await myTokenC.getAddress(),
    ]);
    await myTokenC.setManager(tinyBankC.getAddress());
  });
  describe("Initialized state check", () => {
    it("should return totalStaked 0", async () => {
      expect(await tinyBankC.totalStaked()).equal(0);
    });
    it("should return staked 0 amount of signer0", async () => {
      const signer0 = signers[0];
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });

  describe("Staking", async () => {
    it("should return staked amount", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
      expect(await myTokenC.balanceOf(tinyBankC)).equal(
        await tinyBankC.totalStaked(),
      );
    });
  });
  describe("Withdraw", async () => {
    it("should return 0 staked after withdrawing total token", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      await tinyBankC.withdraw(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });

  describe("Reward", async () => {
    it("should reward 1MT every block", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      const BLOCKS = 5n;
      const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
      for (var i = 0; i < BLOCKS; i++) {
        await myTokenC.transfer(transferAmount, signer0.address);
      }

      await tinyBankC.withdraw(stakingAmount);
      expect(await myTokenC.balanceOf(signer0.address)).equal(
        hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString()),
      );
    });

    it("Should revert when changing rewardPerBlock by hacker", async () => {
      const hacker = signers[3];
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
      await expect(
        tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("You are not a manager");
    });

    describe("HW3 : onlyAllConfirmed", () => {
      const newReward = hre.ethers.parseUnits("100", DECIMALS);
      beforeEach(async () => {
        await tinyBankC.addManager(signers[1].address);
        await tinyBankC.addManager(signers[2].address);
      });

      // 추가한 세 명에 대해서 Manager가 맞는지 확인하는 테스트
      it("register three nanagers", async () => {
        expect(await tinyBankC.isManager(signers[0].address)).equal(true);
        expect(await tinyBankC.isManager(signers[1].address)).equal(true);
        expect(await tinyBankC.isManager(signers[2].address)).equal(true);
      });
      // connect를 통해 Manager가 아닌 signer가 트랜잭션을 보내도록 하고, 실패하는지 확인하는 테스트
      it("rejects confirmation from non-manager", async () => {
        await expect(
          tinyBankC.connect(signers[3]).confirm(),
        ).to.be.revertedWith("You are not a manager");
      });
      // Manager 세 명 중 두명만 동의했을 때 confirm되는지 확인하는 테스트
      it("rejects a reward change when one manager has not confirmed", async () => {
        await tinyBankC.connect(signers[0]).confirm();
        await tinyBankC.connect(signers[1]).confirm();
        await expect(tinyBankC.setRewardPerBlock(newReward)).to.be.revertedWith(
          "Not all confirmed yet",
        );
      });
      // Manager 세 명 모두 동의했을 때 rewardPerBlock이 변경되는지 확인하는 테스트
      it("allows a reward change after all managers confirm", async () => {
        await tinyBankC.connect(signers[0]).confirm();
        await tinyBankC.connect(signers[1]).confirm();
        await tinyBankC.connect(signers[2]).confirm();
        await expect(tinyBankC.setRewardPerBlock(newReward)).not.to.be.reverted;
      });
    });
  });
});
