import {
    PropsWithChildren,
    useCallback,
    useEffect,
    useState,
} from "react"
import { WalletContext } from "./WalletContext"
import { EIP6963ProviderDetail, EIP6963ProviderInfo, SelectedAccountByWallet, EIP6963ProviderEvent, WalletError, WalletProviderContext} from "../config"
import { EIP6963EventNames, LOCAL_STORAGE_KEYS, isSupportedChain, networkInfoMap } from "../config"


// The WalletProvider component wraps all other components in the dapp, providing them with the necessary data and functions related to wallets.
export const WalletProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [wallets, setWallets] = useState<Record<string, EIP6963ProviderDetail>>({})
  const [selectedWalletRdns, setSelectedWalletRdns] = useState<string | null>(null)
  const [selectedAccountByWalletRdns, setSelectedAccountByWalletRdns] = useState<SelectedAccountByWallet>({})

  const [errorMessage, setErrorMessage] = useState("Wallet is not connected")
  const clearError = () => setErrorMessage("")
  const setError = (error: string) => setErrorMessage(error)

  useEffect(() => {
    const savedSelectedWalletRdns = localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_WALLET_RDNS)
    const savedSelectedAccountByWalletRdns = localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_ACCOUNT_BY_WALLET_RDNS)

    if (savedSelectedAccountByWalletRdns) {
      setSelectedAccountByWalletRdns(JSON.parse(savedSelectedAccountByWalletRdns))
    }

    function onAnnouncement(event: EIP6963ProviderEvent) {
      setWallets(currentWallets => ({
        ...currentWallets,
        [event.detail.info.rdns]: event.detail
      }))
      
      if (savedSelectedWalletRdns && event.detail.info.rdns === savedSelectedWalletRdns) {
        setSelectedWalletRdns(savedSelectedWalletRdns)
      }

      clearError();
    }

    window.addEventListener(EIP6963EventNames.Announce, onAnnouncement)
    window.dispatchEvent(new Event(EIP6963EventNames.Request))

    return () => window.removeEventListener(EIP6963EventNames.Announce, onAnnouncement)
    
  }, [])

  useEffect(() => {

    function onChainChanged(event: string) { // event is a string with the new chain id
      
      if (selectedWalletRdns) {
        const wallet = wallets[selectedWalletRdns]
      
        setWallets(currentWallets => ({
          ...currentWallets,
          [wallet.info.rdns]: {
            ...wallet,
            provider: {
              ...wallet.provider,
              chainId: event
            }
        }}))

        clearError();
      }
    }

    if (selectedWalletRdns) {
      wallets[selectedWalletRdns].provider.addListener("chainChanged", onChainChanged)
    }
    
    return () => {
      if (selectedWalletRdns) {
        wallets[selectedWalletRdns].provider.removeListener("chainChanged", onChainChanged)
      }
    }

  }, [selectedWalletRdns])


  useEffect(() => {

    function onAccountsChanged(event: string[]) { // event is a string array with the account as first element

      if (selectedWalletRdns && selectedAccountByWalletRdns) {
        const wallet = wallets[selectedWalletRdns]
      
        setSelectedAccountByWalletRdns((currentAccounts) => ({
          ...currentAccounts,
          [wallet.info.rdns]: event[0],
        }));
      
        localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_ACCOUNT_BY_WALLET_RDNS,
          JSON.stringify({
            ...selectedAccountByWalletRdns,
            [wallet.info.rdns]: event[0],
          })
        )

        clearError();

      }
    }

    if (selectedWalletRdns) {
      wallets[selectedWalletRdns].provider.addListener("accountsChanged", onAccountsChanged)
    }
    
    return () => {
      if (selectedWalletRdns) {
        wallets[selectedWalletRdns].provider.removeListener("accountsChanged", onAccountsChanged)
      }
    }

  }, [selectedWalletRdns, selectedAccountByWalletRdns])


  const connectWallet = useCallback(async (walletRdns: EIP6963ProviderInfo['rdns']) => {
    try {
      const wallet = wallets[walletRdns]
      const accounts = (await wallet.provider.request({
        method: "eth_requestAccounts",
      })) as string[]
      
      if (accounts?.[0]) {
        setSelectedWalletRdns(wallet.info.rdns)
        setSelectedAccountByWalletRdns((currentAccounts) => ({
          ...currentAccounts,
          [wallet.info.rdns]: accounts[0],
        }))
        
        localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_WALLET_RDNS, wallet.info.rdns)
        localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_ACCOUNT_BY_WALLET_RDNS,
          JSON.stringify({
            ...selectedAccountByWalletRdns,
            [wallet.info.rdns]: accounts[0],
          })
        )

        clearError();

      }
    } catch (error) {
      console.error("Failed to connect to provider:", error)
      const walletError: WalletError = error as WalletError
      setError(`Code: ${walletError.code} \nError Message: ${walletError.message}`)
    }
  }, [wallets, selectedAccountByWalletRdns])

  const disconnectWallet = useCallback(async () => {

    if (selectedWalletRdns) {
      
      setSelectedAccountByWalletRdns((currentAccounts) => ({
        ...currentAccounts,
        [selectedWalletRdns]: null,
      }))
  
      const wallet = wallets[selectedWalletRdns]
      setSelectedWalletRdns(null)
      localStorage.removeItem(LOCAL_STORAGE_KEYS.SELECTED_WALLET_RDNS)
  
      try {
        
        await wallet.provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        })

        clearError();

      } catch (error) {
        console.error("Failed to revoke permissions:", error)
        const walletError: WalletError = error as WalletError
        setError(`Code: ${walletError.code} \nError Message: ${walletError.message}`)
      }

    }
  }, [selectedWalletRdns, wallets])


  const switchChain = useCallback( async (chain: number) => {

    if (!isSupportedChain(chain)) {
      setError("Attempt to switch to a non-registered chain!")
      return console.error("Attempt to switch to a non-registered chain!");
    }

    if (selectedWalletRdns) {

      const wallet = wallets[selectedWalletRdns]
      try {
        await wallet.provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${chain.toString(16)}` }],
        });

        clearError();
        // chainChanged event will be triggered
      } catch (error: any) {
        if (error.code === 4902 || error.code === -32603) {
          const chainInfo = networkInfoMap[chain];
          try {
            await wallet.provider.request({
              method: "wallet_addEthereumChain",
              params: [chainInfo],
            });
            // chainChanged event will be triggered
          } catch (addError) {
              console.error("user rejected network addition!");
              const walletError: WalletError = error as WalletError
              setError(`Code: ${walletError.code} \nError Message: ${walletError.message}`)
          }
        }
      }

    }
  }, [selectedWalletRdns, wallets])


  const contextValue: WalletProviderContext = {
    wallets,
    selectedWallet: selectedWalletRdns === null ? null : wallets[selectedWalletRdns],
    selectedAccount: selectedWalletRdns === null ? null : selectedAccountByWalletRdns[selectedWalletRdns],
    errorMessage,
    clearError,
    connectWallet,
    disconnectWallet,
    switchChain,
  }
  
  return (
    <WalletContext.Provider value={contextValue}>
        {children}
    </WalletContext.Provider>
  )


}