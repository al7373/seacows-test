import type { NextPage } from 'next'
import styles from '../styles/Home.module.scss'
import { useEffect, useRef, useState } from 'react'
import detectEthereumProvider from '@metamask/detect-provider';
import { notification } from 'antd';
import Web3 from 'web3';
import TestNftABI from '../lib/abi/TestNftABI.json';
import SeacowsPairABI from '../lib/abi/SeacowsPair/SeacowsPair.json';
import SeacowsRouterABI from '../lib/abi/SeacowsRouter/SeacowsRouter.json';
import nftFromPoolABI from '../lib/abi/nftFromPoolABI.json';
import merkleTree from '../lib/merkle-tree/index.json';

const showNot = (msg, key='error') => {
  notification.open({
    message: '',
    className: `${ styles.mynot }`,
    duration: null,
    description:
      <div className={ styles.description }>
        <i></i>
        <div>
          <p>{ msg }</p>
        </div>
      </div>,
    onClick: () => {
      console.log('Notification Clicked!');
    },
    key
  });
}

const Home: NextPage = () => {

  const accountRef = useRef(null)
	const web3Ref = useRef(null)
	const mintTestNftContractRef = useRef(null)
	const seacowsPairContractRef = useRef(null)

	const [balance, setBalance] = useState(0);

	async function handleAccountsChanged(accounts) {
		if (accounts.length === 0) {
			showNot('Please connect to MetaMask.');
		} else if (accounts[0] !== accountRef.current) {
			accountRef.current = accounts[0];

			const chainId = await window.ethereum.request({ method: 'eth_chainId' });
			handleChainChanged(chainId);

			const balanceResult = await window.ethereum.request({
				method: 'eth_getBalance',
				params: [accountRef.current, 'latest']
			})
			
			let wei = parseInt(balanceResult);
			let balance = wei/(10**18);

			setBalance(balance);

			mintTestNftContractRef.current = new web3Ref.current.eth.Contract(
        TestNftABI, '0x720a1f7ae2c4f9b876852bf14089696c3ee57b1d'
      );


      seacowsPairContractRef.current = new web3Ref.current.eth.Contract(
        SeacowsPairABI,
        '0x1c9f47f8c42c3a8be36dcbe3d49e365b8099c7df'
      )

      let pv = await seacowsPairContractRef.current.methods.pairVariant().call()
			console.log("pv");

      let pt = await seacowsPairContractRef.current.methods.poolType().call()
			console.log("pt");


      let r = await seacowsPairContractRef.current.methods.getAllHeldIds().call()
      let nftFromPool = await seacowsPairContractRef.current.methods.nft().call()

      let nftFromPoolContract = new web3Ref.current.eth.Contract(
        nftFromPoolABI,
        nftFromPool
      )

      //ty merkle tree ty efa mety
      let parsedMerkleTree = merkleTree.tokens.map(({tokenId, group, proof}) => [parseInt(group), proof])

      /*
      //ty efa tsy misy erreur tsony le parametre
			console.log(await seacowsPairContractRef.current.methods.getBuyNFTQuote(
				r, 
        parsedMerkleTree
			).call())
      */

      //console.log([merkleTree[179][1], merkleTree[179][2]])
      /*
      console.log(merkleTree.tokens);
      */

      const name = await nftFromPoolContract.methods.name().call()
      console.log("name", name)

      r.forEach(async (tokenId) => {
        console.log(await nftFromPoolContract.methods.tokenURI(tokenId).call())
      })

      let contract = new web3Ref.current.eth.Contract(
        SeacowsRouterABI,
        '0x927967C413c385c097259dc7a51203a027750d9d'
      )

      console.log('factory', await contract.methods.factory().call())
			

		}
	}

	function handleChainChanged(_chainId) {
		console.log('_chainId', _chainId)
	}



  function handleConnect(){
    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(handleAccountsChanged)
			.catch((err) => {
				if (err.code === 4001) {
					showNot('Please connect to MetaMask.');
				} else {
					console.error(err);
				}
			});
  }

	useEffect(function(){

		(async function(){
			const provider = await detectEthereumProvider();
			if(provider){

        if (provider !== window.ethereum) {
          showNot('Do you have multiple wallets installed?');
        }

				web3Ref.current = new Web3(provider);

				window.ethereum
					.request({ method: 'eth_accounts' })
					.then(handleAccountsChanged)

				window.ethereum.on('chainChanged', handleChainChanged);


			} else {
				showNot('Please install MetaMask.');
			}
		})();


	}, [])

  return (
    <div className={styles.container}>
      <button onClick={ handleConnect }>1.link to metamask wallet</button>
			<div>Balance: <strong>{ balance } ETH</strong></div>
      <button onClick={ handleConnect }>2.Read nft from the pool</button>
    </div>
  )
}

export default Home
