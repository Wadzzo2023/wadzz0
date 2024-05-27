import { useSession } from "next-auth/react";
import { WalletType } from "../../package/connect_wallet/src/lib/enums";
import { SignUserType } from "~/lib/stellar/utils";

const useNeedSign = () => {
  const session = useSession();

  const needSign = (): SignUserType => {
    if (session.data) {
      const walletType = session.data.user.walletType;
      if (walletType === WalletType.isAdmin) {
        return { isAdmin: true };
      } else if (
        walletType === WalletType.emailPass ||
        walletType === WalletType.facebook ||
        walletType === WalletType.google ||
        walletType === WalletType.apple
      ) {
        const email = session.data.user.email;
        if (email) {
          return { email };
        }
      }
    }
    return undefined;
  };

  return { needSign };
};

export default useNeedSign;
