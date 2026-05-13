/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { Copy, ChevronDown } from 'lucide-react'
import { useState } from "react"
import { getCookie } from "cookies-next"
import { Button } from "~/components/shadcn/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/shadcn/ui/collapsible"
import { useModal } from '~/lib/state/play/use-modal-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import toast from 'react-hot-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/shadcn/ui/tooltip"

function AddressWithTooltip({ address }: { address: string }) {
  const [shortAddr, fullAddr] = address.split("::")
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">{addrShort(shortAddr, 5)}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{fullAddr ?? shortAddr}</p>
      </TooltipContent>
    </Tooltip>
  )
}
export default function TransactionDetails() {
  const [isOperationsOpen, setIsOperationsOpen] = useState(false)
  const { isOpen, onClose, type, data } = useModal();

  const [layoutMode] = useState<"modern" | "legacy">(() => {
    const cookieMode = getCookie("wadzzo-layout-mode");
    if (cookieMode === "modern") {
      return "modern";
    }
    if (cookieMode === "legacy") {
      return "legacy";
    }
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("layoutMode");
      if (storedMode === "modern") {
        return "modern";
      }
      if (storedMode === "legacy") {
        return "legacy";
      }
    }
    return "legacy";
  });

  const isModalOpen = isOpen && type === "transaction history";
  const handleClose = () => {
    onClose();
  };
  const { transaction } = data;

  const copyToClipboard = async (text: string) => {

    navigator.clipboard.writeText(text).then((data) => {
      toast.success("Sucessfully copied")
    })

  }

  if (transaction)
    return (
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        {layoutMode === "modern" ? (
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden border-0 bg-[#fbfaf6] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] [&>button]:hidden">
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-semibold text-black">
                  Transaction Details
                </DialogTitle>
              </div>
              <div className="w-full space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Status:</span>
                          <span className={transaction.successful === true ? "text-green-500" : "text-red-500"}>
                            {transaction.successful === true ? 'successful' : 'failed'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Ledger:</span>
                          <span className="ml-2">{transaction.ledger_attr}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Source Account: </span>
                          {addrShort(transaction.source, 5)}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(transaction.source)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Sequence Number:</span>
                          <span className="ml-2">{transaction.sequence}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Memo (TEXT):</span>
                          <span className="ml-2">{transaction.memo}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium">Processed:</span>
                          <span className="ml-2">{new Date(transaction.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Max Fee:</span>
                          <span className="ml-2">{transaction.maxFee} XLM</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Fee Charged:</span>
                          <span className="ml-2">{transaction.fee_charged} XLM</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Operations</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[300px] overflow-y-auto">
                    <TooltipProvider>
                      {transaction.operations?.map((operation, index) => (
                        <div key={index} className="flex items-center justify-between space-x-2 py-2 border-b border-gray-100 last:border-0">
                          <div className="flex-1">
                            {operation.type === "payment" && (
                              <div className="flex items-center gap-2 text-sm">
                                <AddressWithTooltip address={operation.from} /> payment {operation.amount} {operation.asset_code ? operation.asset_code : "XLM"} to <AddressWithTooltip address={operation.to} />
                              </div>
                            )}
                            {operation.type === "change_trust" && (
                              <div className="text-sm"><AddressWithTooltip address={operation.source_account} /> change trust to {operation.asset_code} </div>
                            )}
                            {operation.type === "allow_trust" && (
                              <div className="text-sm">{addrShort(operation.trustor, 5)} allow trust {operation.asset_code} </div>
                            )}
                            {operation.type === "set_options" && (
                              <div className="text-sm"><AddressWithTooltip address={operation.source_account} /> set options </div>
                            )}
                            {operation.type === "create_account" && (
                              <div className="text-sm"><AddressWithTooltip address={operation.source_account} /> create an account {addrShort(operation.account)} with starting balance {operation.starting_balance} XLM </div>
                            )}
                            {operation.type === "account_merge" && (
                              <div className="text-sm"><AddressWithTooltip address={operation.source_account} /> merge account {addrShort(operation.into)} </div>
                            )}
                            {operation.type === "manage_data" && (
                              <div className="text-sm"><AddressWithTooltip address={operation.source_account} /> set data {operation.name} to {addrShort(operation.value.toLocaleString(), 6)} </div>
                            )}
                            {operation.type === "bump_sequence" && (
                              <div className="text-sm"><AddressWithTooltip address={operation.source_account} /> bump sequence </div>
                            )}
                            {operation.type === "inflation" && (
                              <div className="text-sm"><AddressWithTooltip address={operation.source_account} /> inflation </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </TooltipProvider>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        ) : (
          <DialogContent className="md:w-full md:max-w-4xl space-y-4 p-4 overflow-auto">
            <DialogTitle> <div className="px-4 flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Transaction</span>
              <span>{transaction.id}</span>
            </div></DialogTitle>
            <div className="w-full max-w-4xl space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Status:</span>
                        <span className={transaction.successful === true ? "text-green-500" : "text-red-500"}>
                          {transaction.successful === true ? 'successful' : 'failed'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Ledger:</span>
                        <span className="ml-2">{transaction.ledger_attr}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Source Account: </span>
                        {addrShort(transaction.source, 5)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(transaction.source)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Sequence Number:</span>
                        <span className="ml-2">{transaction.sequence}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Memo (TEXT):</span>
                        <span className="ml-2">{transaction.memo}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Processed:</span>
                        <span className="ml-2">{new Date(transaction.createdAt).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Max Fee:</span>
                        <span className="ml-2">{transaction.maxFee} XLM</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Fee Charged:</span>
                        <span className="ml-2">{transaction.fee_charged} XLM</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    {transaction.operations?.map((operation, index) => (
                      <div key={index} className="flex items-center justify-between space-x-2 py-2">
                        <div>
                          {operation.type === "payment" && (
                            <div><AddressWithTooltip address={operation.from} /> payment {operation.amount} {operation.asset_code ? operation.asset_code : "XLM"} to <AddressWithTooltip address={operation.to} /></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </TooltipProvider>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        )}
      </Dialog >
    )
}


function addrShort(addr: string | undefined, size = 7) {
  if (!addr) return ""

  if (addr.length >= 56) {

    return `${addr.substring(0, size)}...${addr.substring(
      addr.length - size,
      addr.length,
    )}`;
  }
  else {
    return addr
  }

}