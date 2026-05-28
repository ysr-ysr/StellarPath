import { Button } from './ui/button';
import { Dialog } from './ui/dialog';

export function ConfirmDialog({ open, title, description, onClose, onConfirm, loading }) {
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : 'Confirm'}
        </Button>
      </div>
    </Dialog>
  );
}
