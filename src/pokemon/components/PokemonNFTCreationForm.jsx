import PropTypes from "prop-types";
import { usePokemonSmartContract } from "../../dapp/hooks";
import { POKEMON_CONTRACT } from "../../dapp/config";
import { capitalize } from "lodash";
import { useState } from "react";

export const PokemonNFTCreationForm = ({ pokemon, encodedImg }) => {

  const { createPokemonNFT, isContractLoaded } = usePokemonSmartContract(POKEMON_CONTRACT.address, POKEMON_CONTRACT.abi);
  const [ pokemonNickname, setPokemonNickname ] = useState(capitalize(pokemon.name));
  
  const onChangeNicknameSubmit = (event) => {
    console.log(event)
    event.preventDefault();
    setPokemonNickname(event.target.value);
  }

  const handleClick = () => {
    //console.log(encodedImg)
    //console.log("Click handled")
    //console.log(pokemonNickname)
    createPokemonNFT(pokemon, encodedImg, pokemonNickname);
  }


  return (
    <>
      { isContractLoaded ?

        <>

          <span>Select and image and a nickname to get your NFT: </span>
          <form className="d-inline">
              <input className="form-control d-inline w-25 m-1" 
                autoComplete="off"
                onChange={ onChangeNicknameSubmit } 
                placeholder={ capitalize(pokemon.name) } 
                value={ pokemonNickname } 
              />
              <button className="btn m-1 pokeGoBackButton d-inline" onClick={ handleClick }>
                  Get NFT
              </button>
          </form>

        </>
        : 
        <>
          <span>Connect to Sepolia Testnet to buy this Pokemon NFT</span>
        </>
      }

    </>
    
  );
}

PokemonNFTCreationForm.propTypes = {
  pokemon: PropTypes.object,
  encodedImg: PropTypes.string
};
