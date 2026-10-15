import hre from "hardhat";
import { expect } from "chai";

describe("TinyBank", () => {
  let myTokenC;
  let tinyBankC;
  beforeEach(async () => {
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      decimals,
      miningAmount,
    ]);
  });
});
