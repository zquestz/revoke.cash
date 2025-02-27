import React, { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import { useEthereum } from 'utils/hooks/useEthereum';
import { Erc721TokenData } from '../common/interfaces';
import { getChainExplorerUrl } from '../common/util';
import Erc721AllowanceList from './Erc721AllowanceList';
import Erc721TokenBalance from './Erc721TokenBalance';
import { Allowance } from './interfaces';
import { getLimitedAllowancesFromApprovals, getUnlimitedAllowancesFromApprovals } from './util';

interface Props {
  token: Erc721TokenData;
  inputAddress: string;
  openSeaProxyAddress?: string;
}

function Erc721Token({ token, inputAddress, openSeaProxyAddress }: Props) {
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { chainId } = useEthereum();

  useEffect(() => {
    loadData();
  }, [inputAddress]);

  const loadData = async () => {
    setLoading(true);

    const unlimitedAllowances = await getUnlimitedAllowancesFromApprovals(
      token.contract,
      inputAddress,
      token.approvalsForAll
    );
    const limitedAllowances = await getLimitedAllowancesFromApprovals(token.contract, token.approvals);
    const allAllowances = [...limitedAllowances, ...unlimitedAllowances].filter((allowance) => allowance !== undefined);

    setAllowances(allAllowances);
    setLoading(false);
  };

  // // Do not render tokens without balance or allowances
  if (token.balance === '0' && allowances.length === 0) return null;

  // // Do not render ERC1155 tokens without allowances
  if (token.balance === 'ERC1155' && allowances.length === 0) return null;

  if (loading) {
    return (
      <div className="Token">
        <ClipLoader size={20} color={'#000'} loading={loading} />
      </div>
    );
  }
  const allowanceEquals = (a: Allowance, b: Allowance) => a.spender === b.spender && a.tokenId === b.tokenId;
  const explorerUrl = `${getChainExplorerUrl(chainId)}/address/${token.contract.address}`;

  return (
    <div className="Token">
      <Erc721TokenBalance symbol={token.symbol} icon={token.icon} balance={token.balance} explorerUrl={explorerUrl} />
      <Erc721AllowanceList
        token={token}
        allowances={allowances}
        inputAddress={inputAddress}
        openSeaProxyAddress={openSeaProxyAddress}
        onRevoke={(allowance: Allowance) => {
          setAllowances((previousAllowances) =>
            previousAllowances.filter((other) => !allowanceEquals(other, allowance))
          );
        }}
      />
    </div>
  );
}

export default Erc721Token;
