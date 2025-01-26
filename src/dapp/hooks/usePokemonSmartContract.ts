import { useCallback, useEffect, useState } from 'react';
import { ContractInterface } from 'ethers';
import { useSmartContract } from './useSmartContract';
import { Pokemon, PokemonContract } from '../config';

export const usePokemonSmartContract = (pokemonContractAddress: string, pokemonContractAbi: ContractInterface) => {

    const {contract: pokemonContract, contractError, setContractError } = useSmartContract<PokemonContract>(pokemonContractAddress, pokemonContractAbi);
    const [isContractLoaded, setIsContractLoaded] = useState(false);

    useEffect(() => {

      const listener = (tokenId: number, nickname: string, personalityValue: number) => {
        console.log("New Pokemon NFT minted:", tokenId, nickname, personalityValue);
      };
  
      if (pokemonContract) {
        pokemonContract.on("NewPokemon", listener);
        setIsContractLoaded(true);
      }
  
      return () => {
        if (pokemonContract) {
          pokemonContract.off("NewPokemon", listener);
          setIsContractLoaded(false);
        }
      }
  
    }, [pokemonContract]);



    const createPokemonNFT = async(pokemon: Pokemon, encodedImg: string, nickName: string) => {

      let secondAbility = "";
  
      if (pokemon.abilities.length > 1) {
        secondAbility = pokemon.abilities[1];
      }
      
      if (pokemonContract) {
        console.log(pokemonContract)
        console.log("Contract and signer are available");
        console.log("Pokemon data:", pokemon);
        console.log("Pokemon nickname:", nickName);
        console.log("Encoded image:", encodedImg);
        
        try {
          const transResponse = await pokemonContract.mintPokemon(
            pokemon.id, 
            nickName, 
            encodedImg, 
            pokemon.abilities[0], 
            secondAbility, 
            pokemon.baseHp, 
            pokemon.baseAtk, 
            pokemon.baseDef, 
            pokemon.baseSpAtk, 
            pokemon.baseSpDef, 
            pokemon.baseSpeed, 
            pokemon.height, 
            pokemon.weight
          );
          debugger;
          const transReceipt = await transResponse.wait();
          console.log("Transaction receipt:", transReceipt);
        } catch (error) {
          //setContractError(error?.message);
          console.error(error);
        }

      } else {
        setContractError("Contract or signer is not available");
        console.error("Contract or signer is not available");
      }
    
    };


      return {
        createPokemonNFT,
        contractError,
        isContractLoaded
      }

}