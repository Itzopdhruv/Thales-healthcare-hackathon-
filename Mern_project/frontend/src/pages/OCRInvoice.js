import React, { useState } from 'react';
import {
  Card,
  Radio,
  Input,
  Button,
  Upload,
  DatePicker,
  InputNumber,
  Select,
  Space,
  Alert,
  message,
  Spin,
  Divider,
  Typography,
  Row,
  Col
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { ocrAPI, inventoryAPI, searchAPI } from '../services/api';
import jsPDF from 'jspdf';

const { Title, Text } = Typography;
const { TextArea } = Input;

const OCRInvoice = () => {
  const [mode, setMode] = useState('manual');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: '',
    clinicName: '',
    date: new Date(),
    medicines: []
  });

  // Handle file upload for OCR
  const handleFileUpload = async (file) => {
    try {
      setLoading(true);
      const response = await ocrAPI.extractTextFromImage(file);
      setExtractedData(response.data);
      
      // Pre-fill form with extracted data
      setFormData(prev => ({
        ...prev,
        patientName: response.data["Patient's Name"] || '',
        doctorName: response.data["Doctor's Name"] || '',
        clinicName: response.data["Clinic Name"] || '',
        medicines: response.data["Medicines Prescribed"] || []
      }));
      
      message.success('Text extracted successfully!');
    } catch (error) {
      message.error('Failed to extract text from image');
      console.error('OCR Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch inventory data
  React.useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await inventoryAPI.getAllMedicines();
        setInventory(response.data);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };
    fetchInventory();
  }, []);

  // Add medicine to prescription
  const addMedicine = () => {
    setMedicines([...medicines, { name: '', quantity: 1 }]);
  };

  // Update medicine in prescription
  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  // Remove medicine from prescription
  const removeMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  // Check medicine availability and find alternatives
  const checkAvailability = async (medicineName, quantity) => {
    const found = inventory.find(med => 
      med.name.toLowerCase() === medicineName.toLowerCase()
    );

    if (found && found.quantity >= quantity) {
      return { available: true, medicine: found };
    }

    // Search for alternatives
    try {
      const response = await searchAPI.searchSimilarMedicines(medicineName, 5);
      const alternatives = response.data
        .map(alt => inventory.find(med => med.name === alt.name))
        .filter(Boolean)
        .filter(med => med.quantity > 0);
      
      return { 
        available: false, 
        alternatives: alternatives.slice(0, 3) 
      };
    } catch (error) {
      console.error('Error finding alternatives:', error);
      return { available: false, alternatives: [] };
    }
  };

  // Process prescription and generate invoice
  const processPrescription = async () => {
    try {
      setLoading(true);
      
      // Check availability for all medicines
      const availabilityResults = await Promise.all(
        medicines.map(async (med) => {
          const result = await checkAvailability(med.name, med.quantity);
          return { ...med, ...result };
        })
      );

      // Filter available medicines
      const availableMedicines = availabilityResults
        .filter(result => result.available)
        .map(result => ({
          name: result.name,
          quantity: result.quantity
        }));

      if (availableMedicines.length === 0) {
        message.error('No medicines are available in stock');
        return;
      }

      // Process sale
      const response = await inventoryAPI.sellMedicines(availableMedicines);
      const invoice = response.data.invoice;

      // Generate PDF
      generateInvoicePDF(invoice);
      
      message.success('Invoice generated and stock updated successfully!');
      setMedicines([]);
      
    } catch (error) {
      message.error('Failed to process prescription');
      console.error('Processing Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF invoice
  const generateInvoicePDF = (invoiceData) => {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Pharmacy Invoice', 105, 20, { align: 'center' });
    
    // Patient and prescription details
    pdf.setFontSize(12);
    pdf.text(`Patient: ${formData.patientName}`, 20, 40);
    pdf.text(`Doctor: ${formData.doctorName}`, 20, 50);
    pdf.text(`Clinic: ${formData.clinicName}`, 20, 60);
    pdf.text(`Date: ${formData.date.toLocaleDateString()}`, 20, 70);
    
    // Items table header
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Medicine', 20, 90);
    pdf.text('Qty', 100, 90);
    pdf.text('Unit Price', 130, 90);
    pdf.text('Subtotal', 170, 90);
    
    // Items
    pdf.setFont(undefined, 'normal');
    let y = 100;
    invoiceData.items.forEach(item => {
      pdf.text(item.name, 20, y);
      pdf.text(item.quantity.toString(), 100, y);
      pdf.text(`₹${item.unit_price.toFixed(2)}`, 130, y);
      pdf.text(`₹${item.subtotal.toFixed(2)}`, 170, y);
      y += 10;
    });
    
    // Total
    pdf.setFont(undefined, 'bold');
    pdf.text('Total', 130, y + 10);
    pdf.text(`₹${invoiceData.total.toFixed(2)}`, 170, y + 10);
    
    // Download
    pdf.save('invoice.pdf');
  };

  const uploadProps = {
    name: 'file',
    accept: 'image/*',
    beforeUpload: handleFileUpload,
    showUploadList: false,
  };

  return (
    <div>
      <Title level={2}>💊 OCR + Invoice Generator</Title>

      <Card style={{ marginBottom: '24px' }}>
        <Radio.Group 
          value={mode} 
          onChange={(e) => setMode(e.target.value)}
          style={{ marginBottom: '16px' }}
        >
          <Radio.Button value="manual">Manual Entry</Radio.Button>
          <Radio.Button value="ocr">OCR via Prescription</Radio.Button>
        </Radio.Group>

        {mode === 'manual' ? (
          <div>
            <Title level={4}>📝 Patient and Prescription Details</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Input
                  placeholder="Patient Name"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                />
              </Col>
              <Col span={8}>
                <Input
                  placeholder="Doctor Name"
                  value={formData.doctorName}
                  onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
                />
              </Col>
              <Col span={8}>
                <Input
                  placeholder="Clinic Name"
                  value={formData.clinicName}
                  onChange={(e) => setFormData({...formData, clinicName: e.target.value})}
                />
              </Col>
            </Row>
          </div>
        ) : (
          <div>
            <Title level={4}>📤 Upload Prescription Image</Title>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} loading={loading}>
                Upload Image
              </Button>
            </Upload>
            
            {extractedData && (
              <div style={{ marginTop: '16px' }}>
                <Alert
                  message="Extracted Data"
                  description={
                    <div>
                      <p><strong>Patient:</strong> {extractedData["Patient's Name"] || 'Not found'}</p>
                      <p><strong>Doctor:</strong> {extractedData["Doctor's Name"] || 'Not found'}</p>
                      <p><strong>Clinic:</strong> {extractedData["Clinic Name"] || 'Not found'}</p>
                      <p><strong>Medicines:</strong> {extractedData["Medicines Prescribed"]?.join(', ') || 'None found'}</p>
                    </div>
                  }
                  type="success"
                  showIcon
                />
              </div>
            )}
          </div>
        )}
      </Card>

      <Card title="💊 Add Medicines" style={{ marginBottom: '24px' }}>
        <Button 
          type="dashed" 
          onClick={addMedicine}
          style={{ marginBottom: '16px' }}
        >
          + Add Medicine
        </Button>

        {medicines.map((medicine, index) => (
          <Card 
            key={index} 
            size="small" 
            style={{ marginBottom: '8px' }}
            actions={[
              <Button 
                type="link" 
                danger 
                onClick={() => removeMedicine(index)}
              >
                Remove
              </Button>
            ]}
          >
            <Row gutter={16} align="middle">
              <Col span={12}>
                <Input
                  placeholder="Medicine Name"
                  value={medicine.name}
                  onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                />
              </Col>
              <Col span={8}>
                <InputNumber
                  min={1}
                  placeholder="Quantity"
                  value={medicine.quantity}
                  onChange={(value) => updateMedicine(index, 'quantity', value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={4}>
                <Button 
                  type="primary" 
                  onClick={async () => {
                    const result = await checkAvailability(medicine.name, medicine.quantity);
                    if (result.available) {
                      message.success(`${medicine.name} is available`);
                    } else {
                      message.warning(`${medicine.name} not available`);
                    }
                  }}
                >
                  Check
                </Button>
              </Col>
            </Row>
          </Card>
        ))}
      </Card>

      <Card title="🔍 Check Availability and Alternatives">
        <Space direction="vertical" style={{ width: '100%' }}>
          {medicines.map((medicine, index) => (
            <div key={index}>
              <Text strong>{medicine.name}</Text>
              <Text type="secondary"> (Qty: {medicine.quantity})</Text>
            </div>
          ))}
        </Space>

        <Divider />

        <Button
          type="primary"
          size="large"
          icon={<FileTextOutlined />}
          onClick={processPrescription}
          loading={loading}
          disabled={medicines.length === 0}
        >
          Generate Invoice and Update Stock
        </Button>
      </Card>
    </div>
  );
};

export default OCRInvoice;
