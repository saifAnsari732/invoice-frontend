import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Form, Input, InputNumber, Button, Select, Divider, Row, Col } from 'antd';

import { PlusOutlined } from '@ant-design/icons';

import { DatePicker } from 'antd';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';

import ItemRow from '@/modules/ErpPanelModule/ItemRow';

import MoneyInputFormItem from '@/components/MoneyInputFormItem';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import { useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';

import calculate from '@/utils/calculate';
import { useSelector } from 'react-redux';
import SelectAsync from '@/components/SelectAsync';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Upload, message, Typography } from 'antd';
import { InboxOutlined, RobotOutlined } from '@ant-design/icons';
import LiveInvoicePreview from './LiveInvoicePreview';
const { Text } = Typography;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""; // Moved to .env for security

function AiAutoFill() {
  const form = Form.useFormInstance();
  const [loading, setLoading] = useState(false);

  const fileToGenerativePart = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          inlineData: {
            data: reader.result.split(',')[1],
            mimeType: file.type
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (info) => {
    const file = info.file;
    if (!file) return;

    try {
      setLoading(true);
      message.loading({ content: 'AI is analyzing the document...', key: 'ai-parsing' });
      
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      // Using gemini-1.5-flash for speed and multimodal support (since user mentioned 3.5 but it's Gemini)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const imagePart = await fileToGenerativePart(file.originFileObj || file);

      const prompt = `You are a data extraction assistant. Parse this invoice or order image and extract the following details into a JSON format exactly matching this schema:
      {
        "ewayBillNumber": "string",
        "placeOfSupply": "string",
        "shipToAddress": "string",
        "items": [
          {
            "itemName": "string",
            "hsn": "string (default 1514 if not found)",
            "brand": "string (default ECO KISAN AGRO if not found)",
            "count": number,
            "size": "string",
            "unit": "string (default Box)",
            "quantity": number,
            "price": number,
            "gstPercentage": number (default 5)
          }
        ]
      }
      Do not include markdown formatting or backticks, just the raw JSON.`;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      let text = response.text();
      
      // Clean up json if model returns markdown
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedData = JSON.parse(text);
      
      form.setFieldsValue({
        ewayBillNumber: parsedData.ewayBillNumber,
        placeOfSupply: parsedData.placeOfSupply,
        shipToAddress: parsedData.shipToAddress,
        items: parsedData.items
      });

      message.success({ content: 'AI Auto-filled successfully!', key: 'ai-parsing' });
    } catch (error) {
      console.error(error);
      message.error({ content: 'AI Parsing failed. Check API key or image format.', key: 'ai-parsing' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f6ffed', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #b7eb8f' }}>
      <Row align="middle" justify="space-between">
        <Col>
          <Text strong style={{ color: '#389e0d', fontSize: '16px' }}><RobotOutlined /> Gemini AI Auto-fill</Text>
          <p style={{ margin: 0, color: '#595959', fontSize: '13px' }}>Upload an image of an invoice or order to instantly fill the form below.</p>
        </Col>
        <Col>
          <Upload 
            accept="image/*"
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleUpload}
          >
            <Button type="primary" icon={<InboxOutlined />} loading={loading} style={{ background: '#389e0d' }}>
              Upload Image to Auto-fill
            </Button>
          </Upload>
        </Col>
      </Row>
    </div>
  );
}

function LivePreviewWrapper({ subTotal, taxTotal, total }) {
  const form = Form.useFormInstance();
  const formValues = Form.useWatch([], form);
  return <LiveInvoicePreview formValues={formValues} subTotal={subTotal} taxTotal={taxTotal} total={total} />;
}

export default function InvoiceForm({ subTotal = 0, current = null }) {
  const { last_invoice_number } = useSelector(selectFinanceSettings);

  if (last_invoice_number === undefined) {
    return <></>;
  }

  return <LoadInvoiceForm subTotal={subTotal} current={current} />;
}

function LoadInvoiceForm({ subTotal = 0, current = null }) {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const { last_invoice_number } = useSelector(selectFinanceSettings);
  const [total, setTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [lastNumber, setLastNumber] = useState(() => last_invoice_number + 1);

  const handelTaxChange = (value) => {
    setTaxRate(value / 100);
  };

  useEffect(() => {
    if (current) {
      const { taxRate = 0, year, number } = current;
      setTaxRate(taxRate / 100);
      setCurrentYear(year);
      setLastNumber(number);
    }
  }, [current]);
  useEffect(() => {
    const currentTotal = calculate.add(calculate.multiply(subTotal, taxRate), subTotal);
    setTaxTotal(Number.parseFloat(calculate.multiply(subTotal, taxRate)));
    setTotal(Number.parseFloat(currentTotal));
  }, [subTotal, taxRate]);

  const addField = useRef(false);

  useEffect(() => {
    addField.current.click();
  }, []);

  return (
    <>
      <AiAutoFill />
      <Row gutter={24}>
        <Col span={9}>
          <div style={{ paddingRight: '10px', height: '800px', overflowY: 'auto', overflowX: 'hidden' }}>
            <Row gutter={[12, 0]}>
        <Col className="gutter-row" span={24}>
          <Form.Item
            name="clientName"
            label={translate('Client Name')}
            rules={[{ required: true }]}
          >
            <Input placeholder="Shop Name / Client Name" />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={24}>
          <Form.Item
            name="clientAddress"
            label={translate('Client Address')}
          >
            <Input.TextArea placeholder="Full Address, City, State" />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={24}>
          <Form.Item
            name="clientPhone"
            label={translate('Contact No')}
          >
            <Input placeholder="Phone / Mobile" />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={3}>
          <Form.Item
            label={translate('number')}
            name="number"
            initialValue={lastNumber}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={3}>
          <Form.Item
            label={translate('year')}
            name="year"
            initialValue={currentYear}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col className="gutter-row" span={5}>
          <Form.Item
            label={translate('status')}
            name="status"
            rules={[
              {
                required: false,
              },
            ]}
            initialValue={'draft'}
          >
            <Select
              options={[
                { value: 'draft', label: translate('Draft') },
                { value: 'pending', label: translate('Pending') },
                { value: 'sent', label: translate('Sent') },
              ]}
            ></Select>
          </Form.Item>
        </Col>

        <Col className="gutter-row" span={8}>
          <Form.Item
            name="date"
            label={translate('Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={6}>
          <Form.Item
            name="expiredDate"
            label={translate('Expire Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={dayjs().add(30, 'days')}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={8}>
          <Form.Item label="E-way Bill Number" name="ewayBillNumber">
            <Input />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={8}>
          <Form.Item label="Place Of Supply" name="placeOfSupply">
            <Input />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={8}>
          <Form.Item label="Ship To Address" name="shipToAddress">
            <Input />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={24}>
          <Form.Item label={translate('Note')} name="notes">
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Divider dashed />
      <Row gutter={[12, 12]} style={{ position: 'relative' }}>
        <Col className="gutter-row" span={5}>
          <p>{translate('Item')}</p>
        </Col>
        <Col className="gutter-row" span={7}>
          <p>{translate('Description')}</p>
        </Col>
        <Col className="gutter-row" span={3}>
          <p>{translate('Quantity')}</p>{' '}
        </Col>
        <Col className="gutter-row" span={4}>
          <p>{translate('Price')}</p>
        </Col>
        <Col className="gutter-row" span={5}>
          <p>{translate('Total')}</p>
        </Col>
      </Row>
      <Form.List name="items">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <ItemRow key={field.key} remove={remove} field={field} current={current}></ItemRow>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add({ hsn: '1514', brand: 'ECO KISAN AGRO', unit: 'Box', gstPercentage: 5, quantity: 1, count: 240 })}
                block
                icon={<PlusOutlined />}
                ref={addField}
              >
                {translate('Add field')}
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
      <Divider dashed />
      <div style={{ position: 'relative', width: ' 100%', float: 'right' }}>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={5}>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>
                {translate('Save')}
              </Button>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={4} offset={10}>
            <p
              style={{
                paddingLeft: '12px',
                paddingTop: '5px',
                margin: 0,
                textAlign: 'right',
              }}
            >
              {translate('Sub Total')} :
            </p>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={subTotal} />
          </Col>
        </Row>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={4} offset={15}>
            <Form.Item
              name="taxRate"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select
                value={taxRate}
                onChange={handelTaxChange}
                placeholder={translate('Select Tax Value')}
                options={[
                  { value: 0, label: '0%' },
                  { value: 5, label: '5%' },
                  { value: 12, label: '12%' },
                  { value: 18, label: '18%' },
                  { value: 28, label: '28%' }
                ]}
              />
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={taxTotal} />
          </Col>
        </Row>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={4} offset={15}>
            <p
              style={{
                paddingLeft: '12px',
                paddingTop: '5px',
                margin: 0,
                textAlign: 'right',
              }}
            >
              {translate('Total')} :
            </p>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={total} />
          </Col>
        </Row>
      </div>
          </div>
        </Col>
        <Col span={15}>
          <div style={{ position: 'sticky', top: 0, height: '800px', overflowY: 'auto' }}>
            <LivePreviewWrapper subTotal={subTotal} taxTotal={taxTotal} total={total} />
          </div>
        </Col>
      </Row>
    </>
  );
}
