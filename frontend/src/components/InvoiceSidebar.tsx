import React from 'react';
import InvoiceButton from './InvoiceButton';
import { X, Eye, Send } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import CurrencySelector from './CurrencySelector';

interface InvoiceSidebarProps {
  loading: boolean;
  onSubmit: () => void;
  onPreview: () => void;
  previewPdfUrl?: string | null;
  setPreviewPdfUrl: (url: string | null) => void;
  previewInvoiceImage?: () => Promise<string | null>;
  // Add new props for live preview
  invoiceData?: {
    from: string;
    to: string;
    invoiceNumber: string;
    issuedDate: string;
    dueDate: string;
    items: any[];
    paymentDetails: string;
    terms: string;
    taxPercent: number;
    discountPercent: number;
    shippingAmount: number;
    showTax: boolean;
    showDiscount: boolean;
    showShipping: boolean;
    taxType: string;
    discountType: string;
    logoUrl?: string | null;
  };
}

const InvoiceSidebar: React.FC<InvoiceSidebarProps> = ({
  loading,
  onSubmit,
  onPreview,
  previewPdfUrl,
  setPreviewPdfUrl,
  invoiceData,
}) => {
  const { currency } = useCurrency();

  // Calculate totals for preview
  const getSubtotal = () => {
    if (!invoiceData?.items) return 0;
    return invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  };

  const getTaxAmount = () => {
    if (!invoiceData?.showTax || !invoiceData?.taxPercent) return 0;
    const subtotal = getSubtotal();
    if (invoiceData.taxType === 'percent') {
      return (subtotal * invoiceData.taxPercent) / 100;
    }
    return invoiceData.taxPercent;
  };

  const getDiscountAmount = () => {
    if (!invoiceData?.showDiscount || !invoiceData?.discountPercent) return 0;
    const subtotal = getSubtotal();
    if (invoiceData.discountType === 'percent') {
      return (subtotal * invoiceData.discountPercent) / 100;
    }
    return invoiceData.discountPercent;
  };

  const getShippingAmount = () => {
    if (!invoiceData?.showShipping || !invoiceData?.shippingAmount) return 0;
    return invoiceData.shippingAmount;
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const tax = getTaxAmount();
    const discount = getDiscountAmount();
    const shipping = getShippingAmount();
    return subtotal + tax - discount + shipping;
  };

  return (
      <>
    <div className="w-full max-w-48 hidden md:flex flex-col sticky top-8 z-10 self-start ">
      {/* Action Buttons */}
      <div className="flex flex-col gap-4 mb-8">
        <InvoiceButton loading={loading} onClick={onSubmit} />

        {/* Send Button */}
        <button
          type="button"
          onClick={onPreview}
          disabled={loading}
          className="w-full hidden px-4 py-4 text-lg btn-secondary whitespace-nowrap font-medium rounded-xl
          flex items-center justify-center gap-2 text-black transition"
        >
          <Send size={20} />
          Send Invoice
        </button>

        {/* Preview Button */}
        <button
          type="button"
          onClick={onPreview}
          disabled={loading}
          className="w-full px-8 hidden py-4 text-lg bg-[#CCF1D3] hover:bg-[#6CDD82] h-[3.5rem] whitespace-nowrap font-medium rounded-xl
          flex items-center justify-center gap-2 text-black transition"
        >
          Preview
          <Eye size={20} />
        </button>

      </div>
      {/* Divider */}
      <hr className="my-3 border-gray-900" />
      {/* Currency Selector below divider */}
      <div className="mt-0">
        {(() => {
          const { currency, setCurrency, currencyOptions } = useCurrency();
          return <CurrencySelector currency={currency} setCurrency={setCurrency} currencyOptions={currencyOptions} />;
        })()}
      </div>
      
      {/* Live Invoice Preview Modal */}
      <div className="mt-6 w-full bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Invoice Preview</h3>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {invoiceData?.logoUrl && (
                <img src={invoiceData.logoUrl} alt="Logo" className="h-12 mb-2" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Invoice #</div>
              <div className="font-semibold text-gray-900">{invoiceData?.invoiceNumber || '#'}</div>
            </div>
          </div>

          {/* From and To */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">From</div>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">{invoiceData?.from || 'Business details...'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">To</div>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">{invoiceData?.to || 'Client details...'}</div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Issued Date</div>
              <div className="text-sm text-gray-900">{invoiceData?.issuedDate || 'Not set'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Due Date</div>
              <div className="text-sm text-gray-900">{invoiceData?.dueDate || 'Not set'}</div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-600 mb-2">Items</div>
            <div className="space-y-2">
              {invoiceData?.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-start text-sm">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.name || 'Item name...'}</div>
                    {item.description && (
                      <div className="text-gray-600 text-xs">{item.description}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-gray-900">
                      {item.quantity || 1} × ${(item.unit_cost || 0).toFixed(2)}
                    </div>
                    <div className="font-semibold text-gray-900">
                      ${((item.quantity || 1) * (item.unit_cost || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              {(!invoiceData?.items || invoiceData.items.length === 0) && (
                <div className="text-gray-500 text-sm italic">No items added</div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">${getSubtotal().toFixed(2)}</span>
              </div>
              
              {invoiceData?.showTax && invoiceData.taxPercent > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Tax ({invoiceData.taxType === 'percent' ? `${invoiceData.taxPercent}%` : 'Fixed'}):
                  </span>
                  <span className="text-gray-900">${getTaxAmount().toFixed(2)}</span>
                </div>
              )}
              
              {invoiceData?.showDiscount && invoiceData.discountPercent > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Discount ({invoiceData.discountType === 'percent' ? `${invoiceData.discountPercent}%` : 'Fixed'}):
                  </span>
                  <span className="text-gray-900">-${getDiscountAmount().toFixed(2)}</span>
                </div>
              )}
              
              {invoiceData?.showShipping && invoiceData.shippingAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="text-gray-900">${getShippingAmount().toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">${getTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Details and Terms */}
          {(invoiceData?.paymentDetails || invoiceData?.terms) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {invoiceData.paymentDetails && (
                <div className="mb-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Payment Details</div>
                  <div className="text-sm text-gray-900">{invoiceData.paymentDetails}</div>
                </div>
              )}
              {invoiceData.terms && (
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Terms</div>
                  <div className="text-sm text-gray-900">{invoiceData.terms}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview PDF */}
      {previewPdfUrl && (
        <div className="mt-10 border border-neutral-700 rounded-md overflow-hidden bg-white">
          <div className="flex justify-between items-center p-4 bg-neutral-900">
            <h3 className="text-lg font-semibold text-indigo-300">Preview</h3>
            <button
              onClick={() => {
                URL.revokeObjectURL(previewPdfUrl);
                setPreviewPdfUrl(null);
              }}
              className="text-sm text-red-400 hover:underline"
            >
              <X size={16} /> Close
            </button>
          </div>
          <div className="p-4">
            <iframe src={previewPdfUrl} title="Invoice Preview" className="w-full h-72 border-none rounded-md" />
          </div>
        </div>
      )}
    </div>
    <div className="md:hidden mb-20">
    <InvoiceButton loading={loading} onClick={onSubmit} />
    </div>

    </>
  );
};

export default InvoiceSidebar;
