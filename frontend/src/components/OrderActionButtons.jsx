import React, { useState } from 'react';
import { 
  ClipboardList, 
  PackageSearch, 
  PackageCheck, 
  Truck, 
  XCircle
} from 'lucide-react';
import Button from './Button';

export function OrderActionButtons({
  order,
  onStatusChange,
  onCancel,
  compact = false,
  loading = false
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pickingPrepared, setPickingPrepared] = useState(false);

  if (!order) return null;

  const { id, status } = order;

  // Handle visual picking step notification
  const handleTogglePicking = () => {
    setPickingPrepared(!pickingPrepared);
  };

  // Compact Mode (for Orders Listing Table)
  if (compact) {
    return (
      <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
        {status === 'Placed' && (
          <>
            <Button
              size="sm"
              variant="primary"
              icon={PackageCheck}
              title="Advance fulfillment to Packed stage"
              disabled={loading}
              onClick={() => onStatusChange?.(id, 'Packed')}
            >
              Pack
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={XCircle}
              title="Cancel order and restore inventory"
              disabled={loading}
              onClick={() => onCancel?.(id)}
            >
              Cancel
            </Button>
          </>
        )}

        {status === 'Packed' && (
          <>
            <Button
              size="sm"
              variant="secondary"
              icon={Truck}
              title="Advance fulfillment to Shipped stage"
              disabled={loading}
              onClick={() => onStatusChange?.(id, 'Shipped')}
            >
              Ship
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={XCircle}
              title="Cancel packed order and restore inventory"
              disabled={loading}
              onClick={() => onCancel?.(id)}
            >
              Cancel
            </Button>
          </>
        )}

        {status === 'Shipped' && (
          <span className="inline-flex items-center text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
            <Truck className="w-3 h-3 mr-1 text-indigo-600" />
            Dispatched
          </span>
        )}

        {status === 'Cancelled' && (
          <span className="inline-flex items-center text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200">
            <XCircle className="w-3 h-3 mr-1 text-rose-500" />
            Cancelled
          </span>
        )}
      </div>
    );
  }

  // Full / Modal Mode
  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-brand-teal uppercase tracking-wider">
          Fulfillment Action Controls
        </span>
        <span className="text-[11px] text-slate-500">
          Server-validated state transitions
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {status === 'Placed' && (
          <>
            {/* Visual Picking Prep Toggle (Does not alter backend status) */}
            <Button
              size="md"
              variant={pickingPrepared ? 'success' : 'outline'}
              icon={PackageSearch}
              onClick={handleTogglePicking}
              title="Visual picking prep check"
            >
              {pickingPrepared ? 'Items Picked ✓' : 'Mark Picked (Prep)'}
            </Button>

            {/* Advance to Packed (Real Backend Transition) in Teal Green */}
            <Button
              size="md"
              variant="primary"
              icon={PackageCheck}
              loading={loading}
              onClick={() => onStatusChange?.(id, 'Packed')}
              title="Transition order to Packed state"
            >
              Mark as Packed
            </Button>

            {/* Cancel Order */}
            {!confirmCancel ? (
              <Button
                size="md"
                variant="danger"
                icon={XCircle}
                disabled={loading}
                onClick={() => setConfirmCancel(true)}
                title="Cancel order and restore product stock"
              >
                Cancel Order
              </Button>
            ) : (
              <div className="flex items-center space-x-2 bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                <span className="text-xs text-rose-800 font-semibold px-1">
                  Restore inventory & cancel?
                </span>
                <Button
                  size="sm"
                  variant="danger"
                  loading={loading}
                  onClick={() => {
                    setConfirmCancel(false);
                    onCancel?.(id);
                  }}
                >
                  Yes, Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmCancel(false)}
                >
                  No, Keep
                </Button>
              </div>
            )}
          </>
        )}

        {status === 'Packed' && (
          <>
            {/* Advance to Shipped in Blue */}
            <Button
              size="md"
              variant="secondary"
              icon={Truck}
              loading={loading}
              onClick={() => onStatusChange?.(id, 'Shipped')}
              title="Transition order to Shipped state"
            >
              Mark as Shipped
            </Button>

            {/* Cancel Order */}
            {!confirmCancel ? (
              <Button
                size="md"
                variant="danger"
                icon={XCircle}
                disabled={loading}
                onClick={() => setConfirmCancel(true)}
                title="Cancel packed order and restore inventory"
              >
                Cancel Order
              </Button>
            ) : (
              <div className="flex items-center space-x-2 bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                <span className="text-xs text-rose-800 font-semibold px-1">
                  Restore inventory & cancel?
                </span>
                <Button
                  size="sm"
                  variant="danger"
                  loading={loading}
                  onClick={() => {
                    setConfirmCancel(false);
                    onCancel?.(id);
                  }}
                >
                  Yes, Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmCancel(false)}
                >
                  No, Keep
                </Button>
              </div>
            )}
          </>
        )}

        {status === 'Shipped' && (
          <div className="w-full flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200 text-xs text-indigo-800">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold">Order Dispatched & Completed</span>
            </div>
            <span className="text-[11px] text-slate-500">Shipped orders are locked and cannot be modified</span>
          </div>
        )}

        {status === 'Cancelled' && (
          <div className="w-full flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span className="font-semibold">Order Cancelled</span>
            </div>
            <span className="text-[11px] text-rose-600">Inventory was restored to warehouse catalogue</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderActionButtons;
