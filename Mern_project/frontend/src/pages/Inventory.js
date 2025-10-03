import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Space,
  Popconfirm,
  message,
  Alert,
  Spin,
  Row,
  Col,
  Statistic,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { inventoryAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const { Title } = Typography;

const Inventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getAllMedicines();
      setMedicines(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to load medicines. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMedicine(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingMedicine(record);
    form.setFieldsValue({
      ...record,
      expiry_date: record.expiry_date ? new Date(record.expiry_date) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await inventoryAPI.deleteMedicine(id);
      message.success('Medicine deleted successfully');
      fetchMedicines();
    } catch (err) {
      message.error('Failed to delete medicine');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const medicineData = {
        ...values,
        expiry_date: values.expiry_date?.format('YYYY-MM-DD'),
      };

      if (editingMedicine) {
        await inventoryAPI.updateMedicine(editingMedicine.id, medicineData);
        message.success('Medicine updated successfully');
      } else {
        await inventoryAPI.addMedicine(medicineData);
        message.success('Medicine added successfully');
      }

      setIsModalVisible(false);
      fetchMedicines();
    } catch (err) {
      if (err.errorFields) {
        message.error('Please fill all required fields');
      } else {
        message.error(err.response?.data?.message || 'Failed to save medicine');
      }
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const filteredMedicines = medicines.filter(medicine =>
    Object.values(medicine).some(value =>
      String(value).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const lowStockMedicines = medicines.filter(medicine => medicine.quantity <= 10);
  const totalValue = medicines.reduce((sum, medicine) => sum + (medicine.price * medicine.quantity), 0);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <MedicineBoxOutlined />
          {text}
          {record.quantity <= 10 && (
            <Tooltip title="Low Stock">
              <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Dosage',
      dataIndex: 'dosage',
      key: 'dosage',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity) => (
        <Tag color={quantity <= 10 ? 'red' : quantity <= 50 ? 'orange' : 'green'}>
          {quantity}
        </Tag>
      ),
    },
    {
      title: 'Price (₹)',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `₹${price.toFixed(2)}`,
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this medicine?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Connection Error"
        description={error}
        type="error"
        showIcon
        style={{ margin: '24px' }}
      />
    );
  }

  return (
    <div>
      <Title level={2}>🧾 Medicine Inventory Management</Title>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Medicines"
              value={medicines.length}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Low Stock Medicines"
              value={lowStockMedicines.length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Value"
              value={totalValue}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Low Stock Alert */}
      {lowStockMedicines.length > 0 && (
        <Alert
          message="Low Stock Alert"
          description={`You have ${lowStockMedicines.length} medicines with low stock (≤10 units).`}
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Search and Add */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Input
              placeholder="Search medicines..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Medicine
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Stock Chart */}
      <Card title="📦 Stock Level Visualization" style={{ marginBottom: '24px' }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={medicines.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <RechartsTooltip />
            <Bar dataKey="quantity" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Medicines Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredMedicines}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} medicines`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Medicine ID"
                name="id"
                rules={[{ required: true, message: 'Please enter medicine ID' }]}
              >
                <Input placeholder="Enter unique ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Medicine Name"
                name="name"
                rules={[{ required: true, message: 'Please enter medicine name' }]}
              >
                <Input placeholder="Enter medicine name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Dosage"
                name="dosage"
                rules={[{ required: true, message: 'Please enter dosage' }]}
              >
                <Input placeholder="e.g., 500mg, 10ml" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Enter quantity"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Price (₹)"
                name="price"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="Enter price"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Expiry Date"
                name="expiry_date"
                rules={[{ required: true, message: 'Please select expiry date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Inventory;
