import React, { useState } from 'react';
import { Typography } from 'antd';
import { useMoney } from '@/settings';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
import { Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';

export default function LiveInvoicePreview({ formValues, subTotal, taxTotal, total }) {
  const { amountFormatter, currency_symbol } = useMoney();
  const [fontSize, setFontSize] = useState(13); // Default increased from 11 to 13

  const formatMoney = (amount) => {
    return currency_symbol + ' ' + amountFormatter({ amount });
  };

  const items = formValues?.items || [];
  
  let calcSubTotal = 0;
  let calcTaxTotal = 0;
  
  const enrichedItems = items.map(item => {
    const qty = Number(item?.quantity) || 0;
    const price = Number(item?.price) || 0;
    const itemBaseTotal = qty * price;
    const gstPercent = Number(item?.gstPercentage) || 5;
    const gstAmt = (itemBaseTotal * gstPercent) / 100;
    
    calcSubTotal += itemBaseTotal;
    calcTaxTotal += gstAmt;
    
    return {
      ...item,
      calculatedBaseTotal: itemBaseTotal,
      calculatedGstAmt: gstAmt,
      gstPercent: gstPercent
    };
  });
  
  const calcGrandTotal = calcSubTotal + calcTaxTotal;

  const displaySubTotal = subTotal > 0 ? subTotal : calcSubTotal;
  const displayTaxTotal = taxTotal > 0 ? taxTotal : calcTaxTotal;
  const displayGrandTotal = total > 0 ? total : calcGrandTotal;
  const clientName = formValues?.clientName || '';
  const clientAddress = formValues?.clientAddress || '';
  const clientPhone = formValues?.clientPhone || '';
  
  const handlePrint = () => {
    const printContent = document.getElementById('invoice-preview-container');
    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Print Invoice</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            * { box-sizing: border-box; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 3px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <Button.Group>
          <Button onClick={() => setFontSize(f => Math.max(8, f - 1))}>A-</Button>
          <Button onClick={() => setFontSize(f => Math.min(24, f + 1))}>A+</Button>
        </Button.Group>
        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          Print Preview
        </Button>
      </div>
      <div id="invoice-preview-container" style={{
        width: '100%',
      backgroundColor: '#fff',
      padding: '20px',
      border: '1px solid #ccc',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#000',
      minHeight: '842px', // A4 approx height
    }}>
      <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '5px', position: 'relative' }}>
        Tax Invoice
        <span style={{ position: 'absolute', right: 0, top: 0, fontSize: '12px', fontWeight: 'normal', color: '#555' }}>ORIGINAL</span>
      </div>

      <div style={{ border: '1px solid #000', marginBottom: '-1px', display: 'flex', padding: '10px' }}>
        <div style={{ flex: 1, paddingLeft: '15px' }}>
          <img src="/company-Logo.webp" alt="Company Logo" style={{ maxHeight: '80px', maxWidth: '300px', marginBottom: '10px' }} />
          <div>11/3, Irrigation Colony, Lucknow</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
            <div>
              <div>Phone: 1800 8890 860</div>
              <div>GSTIN: 09AWBPP8744M1ZB</div>
            </div>
            <div>
              <div>Email: kisangroups09@gmail.com</div>
              <div>State: 09-Uttar Pradesh</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', border: '1px solid #000', marginBottom: '-1px' }}>
        <div style={{ width: '50%', padding: '5px', borderRight: '1px solid #000' }}>
          <div style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0', padding: '3px 5px', margin: '-5px -5px 5px -5px', borderBottom: '1px solid #000' }}>
            Bill To:
          </div>
          <div style={{ fontWeight: 'bold' }}>{clientName || 'Client Name'}</div>
          <div>{clientAddress || 'Client Address'}</div>
          <div>Contact No: {clientPhone || ''}</div>
        </div>
        <div style={{ width: '50%', padding: '5px' }}>
          <div style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0', padding: '3px 5px', margin: '-5px -5px 5px -5px', borderBottom: '1px solid #000' }}>
            Invoice Details:
          </div>
          <table style={{ width: '100%', border: 'none', textAlign: 'left', fontSize: `${fontSize}px` }}>
            <tbody>
              <tr>
                <td>No:</td>
                <td style={{ fontWeight: 'bold' }}>{formValues?.number || 'Auto-generated'} / {formValues?.year || dayjs().year()}</td>
              </tr>
              <tr>
                <td>Date:</td>
                <td style={{ fontWeight: 'bold' }}>{formValues?.date ? dayjs(formValues.date).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY')}</td>
              </tr>
              <tr>
                <td>E-Way Bill:</td>
                <td style={{ fontWeight: 'bold' }}>{formValues?.ewayBillNumber || ''}</td>
              </tr>
              <tr>
                <td>Place of Supply:</td>
                <td style={{ fontWeight: 'bold' }}>{formValues?.placeOfSupply || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ border: '1px solid #000', padding: '5px', marginBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0', padding: '3px 5px', margin: '-5px -5px 5px -5px', borderBottom: '1px solid #000' }}>
          Ship To:
        </div>
        <div>{formValues?.shipToAddress || clientAddress || 'Shipping Address'}</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: `${fontSize - 1}px` }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#f0f0f0' }}>#</th>
            <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#f0f0f0', textAlign: 'left' }}>Item name</th>
            <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#f0f0f0' }}>HSN/SAC</th>
            <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#f0f0f0' }}>BRAND</th>
            <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#f0f0f0' }}>Count</th>
            <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#f0f0f0' }}>Size</th>
            <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#f0f0f0' }}>Qty</th>
            <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#f0f0f0' }}>Unit</th>
            <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#f0f0f0' }}>Price/Unit</th>
            <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#f0f0f0' }}>GST</th>
            <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#f0f0f0' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {enrichedItems.map((item, index) => {
            return (
              <tr key={index}>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ border: '1px solid #000', padding: '3px' }}>
                  {item?.itemName}
                  {item?.description && <><br /><span style={{ fontSize: '9px', color: '#555' }}>{item.description}</span></>}
                </td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{item?.hsn}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{item?.brand}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{item?.count}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{item?.size}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{item?.quantity}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{item?.unit}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{formatMoney(item?.price || 0)}</td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>
                  {formatMoney(item.calculatedGstAmt)}<br />
                  ({item.gstPercent}%)
                </td>
                <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'right' }}>{formatMoney(item.calculatedBaseTotal)}</td>
              </tr>
            );
          })}
          
          <tr>
            <td colSpan="10" style={{ border: '1px solid #000', borderTop: '2px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>Sub Total</td>
            <td style={{ border: '1px solid #000', borderTop: '2px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(displaySubTotal)}</td>
          </tr>
          <tr>
            <td colSpan="10" style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>Total Tax</td>
            <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(displayTaxTotal)}</td>
          </tr>
          <tr>
            <td colSpan="10" style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>Grand Total</td>
            <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(displayGrandTotal)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <strong style={{ fontSize: '12px' }}>Terms & Conditions:</strong>
          <ol style={{ paddingLeft: '15px', marginTop: '5px', fontSize: '10px' }}>
            <li>E. & O.E.</li>
            <li>Subject to Lucknow Jurisdiction.</li>
          </ol>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>For KISAN INDIA PLUS</div>
          <br /><br /><br />
          <div>Authorized Signatory</div>
        </div>
      </div>
    </div>
    </div>
  );
}
