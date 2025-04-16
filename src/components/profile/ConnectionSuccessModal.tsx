import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2 } from 'lucide-react';

interface ConnectionSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConnectionSuccessModal: React.FC<ConnectionSuccessModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        <div className="mt-8 mb-4"> {/* Added margin-top to push content down from the X */}
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Confirmed</h2>
        <p className="text-sm text-muted-foreground mb-6">Account Connected Successfully</p>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionSuccessModal;