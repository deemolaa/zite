import type { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

// postDeploy helper under scripts/utils.
import { postDeploy } from "../../postDeploy";

const func: DeployFunction = async ( hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network} = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const res = await deploy("ConfidentialDonation", { from: deployer, log: true, autoMine: true });
  log(`ConfidentialDonation deployed at ${res.address} on ${network.name}`);

  // this generates site/abi/<Contract>ABI.ts and <Contract>Addresses.ts
  await postDeploy(network.name, "ConfidentialDonation");
};

export default func;
func.tags = ["ConfidentialDonation"];
