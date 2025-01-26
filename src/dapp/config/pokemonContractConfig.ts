import { BaseContract, Contract } from 'ethers';
import * as abiFile from './abi.json';
import { TransactionResponse } from '@ethersproject/providers';

export const POKEMON_CONTRACT = {
    deployedNetwork: 11155111,

    address: "0x0d36C08548B86d8B95C1A8bcB00Ba6960A6cBbe6",

    abi: JSON.stringify(abiFile.abi)
}
export interface Pokemon {
    id: number;
    name: string;
    abilities: string[];
    baseHp: number;
    baseAtk: number;
    baseDef: number;
    baseSpAtk: number;
    baseSpDef: number;
    baseSpeed: number;
    height: number;
    weight: number;
}



export class PokemonContract extends Contract {
  [x: string]: any;

    // Add custom methods for your PokemonContract
    //mintPokemon: (pokedexId: number, nickname: string, imgEncodedSprite: string, ability1Name: string, ability2Name: string, baseHp: number, baseAttack: number, baseDefense: number, baseAttackSp: number, baseDefenseSp: number, baseSpeed: number, baseHeight: number, baseWeight: number) => Promise<TransactionResponse>;

}

