import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Row, Col } from 'antd';

import { DeleteOutlined } from '@ant-design/icons';
import { useMoney, useDate } from '@/settings';
import calculate from '@/utils/calculate';

export default function ItemRow({ field, remove, current = null }) {
  const [totalState, setTotal] = useState(undefined);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);

  const money = useMoney();
  const updateQt = (value) => {
    setQuantity(value);
  };
  const updatePrice = (value) => {
    setPrice(value);
  };

  useEffect(() => {
    if (current) {
      // When it accesses the /payment/ endpoint,
      // it receives an invoice.item instead of just item
      // and breaks the code, but now we can check if items exists,
      // and if it doesn't we can access invoice.items.

      const { items, invoice } = current;

      if (invoice) {
        const item = invoice[field.fieldKey];

        if (item) {
          setQuantity(item.quantity);
          setPrice(item.price);
        }
      } else {
        const item = items[field.fieldKey];

        if (item) {
          setQuantity(item.quantity);
          setPrice(item.price);
        }
      }
    }
  }, [current]);

  useEffect(() => {
    const currentTotal = calculate.multiply(price, quantity);

    setTotal(currentTotal);
  }, [price, quantity]);

  return (
    <Row gutter={[8, 8]} style={{ position: 'relative', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #ccc' }}>
      <Col md={7} sm={24}>
        <Form.Item name={[field.name, 'itemName']} rules={[{ required: true }]} label="Item Name">
          <Input placeholder="Item Name" />
        </Form.Item>
      </Col>
      <Col md={4} sm={12}>
        <Form.Item name={[field.name, 'hsn']} label="HSN/SAC">
          <Input placeholder="1514" />
        </Form.Item>
      </Col>
      <Col md={5} sm={12}>
        <Form.Item name={[field.name, 'brand']} label="Brand">
          <Input placeholder="ECO KISAN" />
        </Form.Item>
      </Col>
      <Col md={4} sm={12}>
        <Form.Item name={[field.name, 'count']} label="Count">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
      </Col>
      <Col md={4} sm={12}>
        <Form.Item name={[field.name, 'size']} label="Size">
          <Input placeholder="1LTR" />
        </Form.Item>
      </Col>
      <Col md={4} sm={12}>
        <Form.Item name={[field.name, 'unit']} label="Unit">
          <Input placeholder="Box" />
        </Form.Item>
      </Col>
      <Col md={4} sm={12}>
        <Form.Item name={[field.name, 'quantity']} rules={[{ required: true }]} label="Qty">
          <InputNumber style={{ width: '100%' }} min={0} onChange={updateQt} />
        </Form.Item>
      </Col>

      <Col md={5} sm={12}>
        <Form.Item name={[field.name, 'price']} rules={[{ required: true }]} label="Price/Unit">
          <InputNumber
            className="moneyInput"
            onChange={updatePrice}
            min={0}
            controls={false}
            addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
            addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
          />
        </Form.Item>
      </Col>
      <Col md={4} sm={12}>
        <Form.Item name={[field.name, 'gstPercentage']} label="GST (%)">
          <InputNumber style={{ width: '100%' }} min={0} max={100} />
        </Form.Item>
      </Col>
      <Col md={7} sm={24}>
        <Form.Item name={[field.name, 'total']} label="Total Amount">
          <Form.Item>
            <InputNumber
              readOnly
              className="moneyInput"
              value={totalState}
              min={0}
              controls={false}
              addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
              addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
              formatter={(value) =>
                money.amountFormatter({ amount: value, currency_code: money.currency_code })
              }
            />
          </Form.Item>
        </Form.Item>
      </Col>

      <div style={{ position: 'absolute', right: '0px', top: '10px' }}>
        <DeleteOutlined onClick={() => remove(field.name)} style={{ color: 'red' }} />
      </div>
    </Row>
  );
}
