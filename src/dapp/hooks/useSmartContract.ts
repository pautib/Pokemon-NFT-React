import { useEffect, useState } from "react"
import { Contract, BaseContract, ContractInterface } from "ethers";
import { Web3Provider, JsonRpcSigner } from "@ethersproject/providers";
import { useWalletProvider } from "./useWalletProvider";

export const useSmartContract = <T extends Contract | BaseContract>(contractAddress: string, contractAbi: ContractInterface) => {
    const initErrorMessage = "Please connect your wallet";

    const { selectedWallet } = useWalletProvider();
    const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
    const [contract, setContract] = useState<T | null>(null);
    const [contractError, setContractError] = useState<string | null>(initErrorMessage);

    const clearError = () => setContractError("")

    const clearContractStates = () =>  {
        setContract(null);
        setSigner(null);
        setContractError(initErrorMessage);
    }

    const checkContractDeployment = async (contract: Contract) => {
        console.log("Checking contract deployment...");
        try {
            await contract.deployed();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    };

    useEffect(() => {

        clearContractStates();

        if (selectedWallet) {

            const ethersProvider = new Web3Provider(selectedWallet.provider);
            
            const ethersSigner = ethersProvider.getSigner()
            setSigner(ethersSigner);

            const theContract = new Contract(contractAddress, contractAbi, ethersSigner);
            setContract(theContract as T);
            console.log(theContract)
            checkContractDeployment(theContract)
                .then((isDeployed) => {
                    if (isDeployed) {
                        console.log("Contract is deployed on the selected network.");
                        clearError();
                    } else {
                        setContract(null);
                        setContractError("Contract is not deployed on the selected network.");
                        console.log("Contract is not deployed on the selected network.");
                        //throw new Error("Contract is not deployed on the selected network.");
                    }
                })
                .catch((e) => {
                    setContractError(e);
                    console.error(e);
                });
        }

    }, [selectedWallet]);

    return {
        contract,
        signer,
        contractError,
        setContractError
    };

}