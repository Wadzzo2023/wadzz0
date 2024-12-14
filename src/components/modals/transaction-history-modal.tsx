import { Horizon } from '@stellar/stellar-sdk'
import { Copy, ChevronDown } from 'lucide-react'
import { useState } from "react"
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
import { addrShort } from '~/utils/utils'

export default function TransactionDetails() {
  const [isOperationsOpen, setIsOperationsOpen] = useState(false)
  const { isOpen, onClose, type, data } = useModal();

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
        <DialogContent className="md:w-full md:max-w-4xl  space-y-4 p-4  overflow-auto">
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
                      <span className="ml-2">{transaction.createdAt}</span>
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
                <CardTitle>Signatures</CardTitle>
              </CardHeader>
              <CardContent>
                {transaction.signatures?.map((signature, index) => (
                  <div key={index} className="flex items-center justify-between space-x-2 py-2">
                    <span className="text-sm font-mono truncate">{signature}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(signature)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    )
}

