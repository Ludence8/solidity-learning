import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const miningAmount = 100n;
const decimals = 18n;

describe("My Token", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];
  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      decimals,
      miningAmount,
    ]);
  });
  describe("basic state value check", () => {
    it("should return name", async () => {
      expect(await myTokenC.name()).equal("MyToken");
    });
    it("should return symbol", async () => {
      expect(await myTokenC.symbol()).equal("MT");
    });
    it("should return decimals", async () => {
      expect(await myTokenC.decimals()).equal(decimals);
    });
    it("should return 100 totalSupply", async () => {
      expect(await myTokenC.totalSupply()).equal(
        miningAmount * 10n ** decimals,
      );
    });
  });

  describe("Mint", () => {
    it("should return 1MT balance for signer 0", async () => {
      const signer = signers[0];
      expect(await myTokenC.balanceOf(signer.address)).equal(
        miningAmount * 10n ** decimals,
      );
    });
  });

  describe("Transfer", () => {
    it("should have 0.5MT", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        await myTokenC.transfer(
          hre.ethers.parseUnits("0.5", decimals),
          signer1.address,
        ),
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(
          signer0.address,
          signer1.address,
          hre.ethers.parseUnits("0.5", decimals),
        );
      expect(1)
        .to.emit(myTokenC, "Transfer")
        .withArgs(
          signer0.address,
          signer1.address,
          hre.ethers.parseUnits("0.5", decimals),
        );
      expect(await myTokenC.balanceOf(signer1.address)).equal(
        hre.ethers.parseUnits("0.5", decimals),
      );
    });
    it("should be reverted with insufficient balance error", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits((miningAmount + 1n).toString(), decimals),
          signer1.address,
        ),
      ).to.be.revertedWith("insufficient balance");
    });
  });
  describe("TransferFrom", () => {
    it("should emit Approval event", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.approve(
          signer1.address,
          hre.ethers.parseUnits("10", decimals),
        ),
      )
        .to.emit(myTokenC, "Approval")
        .withArgs(signer1.address, hre.ethers.parseUnits("10", decimals));
    });
    it("should be reverted with insufficient allowance error", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        myTokenC
          .connect(signer1)
          .transferFrom(
            signer0.address,
            signer1.address,
            hre.ethers.parseUnits("1", decimals),
          ),
      ).to.be.revertedWith("insufficient allowance");
    });
    // HW2 : approve, transferFrom test
    it("should transfer signer0's 10MT to signer1 with approve, transferFrom", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await myTokenC
        .connect(signer0)
        .approve(signer1.address, hre.ethers.parseUnits("10", decimals));
      await expect(
        myTokenC
          .connect(signer1)
          .transferFrom(
            signer0.address,
            signer1.address,
            hre.ethers.parseUnits("10", decimals),
          ),
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(
          signer0.address,
          signer1.address,
          hre.ethers.parseUnits("10", decimals),
        );

      expect(await myTokenC.balanceOf(signer1.address)).equal(
        hre.ethers.parseUnits("10", decimals),
      );
      expect(await myTokenC.balanceOf(signer0.address)).equal(
        hre.ethers.parseUnits((miningAmount - 10n).toString(), decimals),
      );
      expect(await myTokenC.allowance(signer0.address, signer1.address)).equal(
        hre.ethers.parseUnits("0", decimals),
      );
    });
  });
});
