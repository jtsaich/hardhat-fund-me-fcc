const { deployments, getNamedAccounts, ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      async function deployFundMeFixture() {
        const deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        const fundMe = await ethers.getContract("FundMe", deployer);
        const mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );

        return { deployer, fundMe, mockV3Aggregator };
      }

      const sendValue = ethers.utils.parseEther("1");
      const totalFunders = 6;

      describe("constructor", async function () {
        it("sets aggregator address correctly", async function () {
          const { fundMe, mockV3Aggregator } = await loadFixture(
            deployFundMeFixture
          );
          const response = await fundMe.getPriceFeed();
          expect(response).to.equal(mockV3Aggregator.address);
        });
      });

      describe("fund", async function () {
        it("fails if you won't send enough ETH", async function () {
          const { fundMe } = await loadFixture(deployFundMeFixture);
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });

        it("updates the amount funded data structure", async function () {
          const { deployer, fundMe } = await loadFixture(deployFundMeFixture);

          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          expect(response.toString()).to.equal(sendValue.toString());
        });

        it("add funder to array of funders", async function () {
          const { deployer, fundMe } = await loadFixture(deployFundMeFixture);

          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunders(0);
          expect(funder, deployer);
        });
      });

      describe("withdraw", async function () {
        beforeEach(async function () {
          const { deployer, fundMe } = await loadFixture(deployFundMeFixture);
          await fundMe.fund({ value: sendValue });
        });

        // it("withdraw ETH from a single funder", async function () {
        //   // Arrange
        //   const { deployer, fundMe } = await loadFixture(deployFundMeFixture);
        //   const startingFundMeBalance = await fundMe.provider.getBalance(
        //     fundMe.address
        //   );
        //   const startingDeployerBalance = await fundMe.provider.getBalance(
        //     deployer
        //   );

        //   // Act
        //   const transactionResponse = await fundMe.withdraw();
        //   const { effectiveGasPrice, gasUsed } = await transactionResponse.wait(1);
        //   const gasCost = effectiveGasPrice.mul(gasUsed);

        //   const endingFundMeBalance = await fundMe.provider.getBalance(
        //     fundMe.address
        //   );
        //   const endingDeployerBalancer = await fundMe.provider.getBalance(deployer);

        //   // Expect
        //   expect(endingFundMeBalance).is.equals(0);
        //   expect(endingDeployerBalancer.add(gasCost).toString()).is.equals(
        //     startingFundMeBalance.add(startingDeployerBalance).toString()
        //   );
        // });

        it("cheaperWithdraw ETH from a single funder", async function () {
          // Arrange
          const { deployer, fundMe } = await loadFixture(deployFundMeFixture);
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.cheaperWithdraw();
          const { effectiveGasPrice, gasUsed } = await transactionResponse.wait(
            1
          );
          const gasCost = effectiveGasPrice.mul(gasUsed);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalancer = await fundMe.provider.getBalance(
            deployer
          );

          // Expect
          expect(endingFundMeBalance).is.equals(0);
          expect(endingDeployerBalancer.add(gasCost).toString()).is.equals(
            startingFundMeBalance.add(startingDeployerBalance).toString()
          );
        });

        // it("allows us to withdraw ETH with multiple funders", async function () {
        //   // Arrange
        //   const { deployer, fundMe } = await loadFixture(deployFundMeFixture);
        //   const accounts = await ethers.getSigners();
        //   for (let i = 1; i < totalFunders; i++) {
        //     const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        //     fundMeConnectedContract.fund({ value: sendValue });
        //   }

        //   const startingFundMeBalance = await fundMe.provider.getBalance(
        //     fundMe.address
        //   );
        //   const startingDeployerBalance = await fundMe.provider.getBalance(
        //     deployer
        //   );

        //   // Act
        //   const transactionResponse = await fundMe.withdraw();
        //   const { effectiveGasPrice, gasUsed } = await transactionResponse.wait(1);
        //   const gasCost = effectiveGasPrice.mul(gasUsed);

        //   const endingFundMeBalance = await fundMe.provider.getBalance(
        //     fundMe.address
        //   );
        //   const endingDeployerBalancer = await fundMe.provider.getBalance(deployer);

        //   // // Expect
        //   expect(endingFundMeBalance).is.equals(0);
        //   expect(endingDeployerBalancer.add(gasCost).toString()).is.equals(
        //     startingFundMeBalance.add(startingDeployerBalance).toString()
        //   );

        //   await expect(fundMe.getFunders(0)).to.be.reverted;

        //   for (i = 1; i < totalFunders; i++) {
        //     expect(
        //       await fundMe.getAddressToAmountFunded(accounts[i].address)
        //     ).is.equal(0);
        //   }
        // });

        it("allows us to cheaperWithdraw ETH with multiple funders", async function () {
          // Arrange
          const { deployer, fundMe } = await loadFixture(deployFundMeFixture);
          const accounts = await ethers.getSigners();
          for (let i = 1; i < totalFunders; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.cheaperWithdraw();
          const { effectiveGasPrice, gasUsed } = await transactionResponse.wait(
            1
          );
          const gasCost = effectiveGasPrice.mul(gasUsed);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalancer = await fundMe.provider.getBalance(
            deployer
          );

          // // Expect
          expect(endingFundMeBalance).is.equals(0);
          expect(endingDeployerBalancer.add(gasCost).toString()).is.equals(
            startingFundMeBalance.add(startingDeployerBalance).toString()
          );

          await expect(fundMe.getFunders(0)).to.be.reverted;

          for (i = 1; i < totalFunders; i++) {
            expect(
              await fundMe.getAddressToAmountFunded(accounts[i].address)
            ).is.equal(0);
          }
        });

        // it("only allows the owner to withdraw", async function () {
        //   const { deployer, fundMe } = await loadFixture(deployFundMeFixture);
        //   const accounts = await ethers.getSigners();
        //   const attacker = accounts[1];
        //   const attackerConnectedContract = fundMe.connect(attacker);
        //   await expect(
        //     attackerConnectedContract.withdraw()
        //   ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
        // });
      });
    });
