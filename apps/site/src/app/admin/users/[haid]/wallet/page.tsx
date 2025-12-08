import UserWalletPageComponent from '@/components/wallets/UserWalletPage'
import { WalletRepository } from '@/shared/repositories/wallet.repository'
import { notFound } from 'next/navigation'
import { EsnadWallet } from '@/shared/types/esnad-finance'


export default async function UserWalletPage({ params }: { params: Promise<{ haid: string }> }) {
    const { haid } = await params

    const walletRepository = WalletRepository.getInstance()
    const wallet = await walletRepository.getWalletByHumanHaid(haid)
    if (!wallet) {
        return notFound()
    }   
    return <UserWalletPageComponent wallet={wallet as EsnadWallet}/>
}