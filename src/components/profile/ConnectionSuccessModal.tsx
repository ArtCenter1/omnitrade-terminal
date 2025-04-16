import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';

interface ConnectionSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConnectionSuccessModal: React.FC<ConnectionSuccessModalProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
        <div className="mt-4 mb-4">
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Exchange Connected!</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Your exchange account has been successfully connected.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          You can now view your portfolio and trade on this exchange.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionSuccessModal;
