import HealthMetrics from '../models/HealthMetrics.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';

// Helper function to calculate health status based on values
const calculateHealthStatus = (bloodPressure, heartRate, bloodSugar, weight) => {
  const status = {
    bloodPressure: 'Normal',
    heartRate: 'Normal',
    bloodSugar: 'Normal',
    weight: 'Stable'
  };

  // Blood Pressure Status
  const systolic = bloodPressure.systolic;
  const diastolic = bloodPressure.diastolic;
  if (systolic < 90 || diastolic < 60) {
    status.bloodPressure = 'Low';
  } else if (systolic >= 140 || diastolic >= 90) {
    status.bloodPressure = 'High';
  } else if (systolic >= 120 || diastolic >= 80) {
    status.bloodPressure = 'Pre-High';
  }

  // Heart Rate Status
  const hr = heartRate.value;
  if (hr < 60) {
    status.heartRate = 'Bradycardia';
  } else if (hr > 100) {
    status.heartRate = 'Tachycardia';
  } else if (hr >= 90) {
    status.heartRate = 'High';
  } else if (hr <= 70) {
    status.heartRate = 'Low';
  }

  // Blood Sugar Status
  const bs = bloodSugar.value;
  if (bs < 70) {
    status.bloodSugar = 'Low';
  } else if (bs >= 126) {
    status.bloodSugar = 'Diabetic';
  } else if (bs >= 100) {
    status.bloodSugar = 'Pre-Diabetic';
  } else if (bs >= 90) {
    status.bloodSugar = 'High';
  }

  // Weight Status (assuming adult BMI calculation)
  const w = weight.value;
  // For simplicity, using basic weight ranges - in real app, would use BMI
  if (w < 50) {
    status.weight = 'Underweight';
  } else if (w > 100) {
    status.weight = 'Obese';
  } else if (w > 80) {
    status.weight = 'Overweight';
  } else if (w < 60) {
    status.weight = 'Lost';
  } else if (w > 70) {
    status.weight = 'Gained';
  }

  return status;
};

// Add new health metrics for a patient
export const addHealthMetrics = async (req, res) => {
  try {
    const { abhaId, bloodPressure, heartRate, bloodSugar, weight, notes } = req.body;
    
    console.log('Adding health metrics for patient:', abhaId);
    console.log('Request body:', req.body);

    // Find patient by ABHA ID
    const patient = await Patient.findOne({ abhaId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Validate required fields
    if (!bloodPressure || !heartRate || !bloodSugar || !weight) {
      return res.status(400).json({
        success: false,
        message: 'All health metrics are required'
      });
    }

    // Validate blood pressure structure
    if (!bloodPressure.systolic || !bloodPressure.diastolic) {
      return res.status(400).json({
        success: false,
        message: 'Blood pressure must have both systolic and diastolic values'
      });
    }

    // Validate heart rate structure
    if (!heartRate.value) {
      return res.status(400).json({
        success: false,
        message: 'Heart rate must have a value'
      });
    }

    // Validate blood sugar structure
    if (!bloodSugar.value) {
      return res.status(400).json({
        success: false,
        message: 'Blood sugar must have a value'
      });
    }

    // Validate weight structure
    if (!weight.value) {
      return res.status(400).json({
        success: false,
        message: 'Weight must have a value'
      });
    }

    // Calculate health status based on values
    const calculatedStatus = calculateHealthStatus(bloodPressure, heartRate, bloodSugar, weight);

    // Create new health metrics record
    const healthMetrics = new HealthMetrics({
      patientId: patient._id,
      abhaId: abhaId,
      bloodPressure: {
        systolic: parseInt(bloodPressure.systolic),
        diastolic: parseInt(bloodPressure.diastolic)
      },
      heartRate: {
        value: parseInt(heartRate.value),
        unit: heartRate.unit || 'bpm'
      },
      bloodSugar: {
        value: parseInt(bloodSugar.value),
        unit: bloodSugar.unit || 'mg/dL'
      },
      weight: {
        value: parseInt(weight.value),
        unit: weight.unit || 'kg'
      },
      status: calculatedStatus,
      recordedBy: req.user?.id || null, // Make optional for now
      recordedByName: req.user?.name || 'Admin/Doctor',
      notes: notes || ''
    });

    await healthMetrics.save();

    console.log('Health metrics saved successfully:', healthMetrics._id);

    res.status(201).json({
      success: true,
      message: 'Health metrics added successfully',
      data: {
        healthMetrics: {
          id: healthMetrics._id,
          patientId: patient._id,
          abhaId: abhaId,
          bloodPressure: healthMetrics.bloodPressure,
          heartRate: healthMetrics.heartRate,
          bloodSugar: healthMetrics.bloodSugar,
          weight: healthMetrics.weight,
          status: healthMetrics.status,
          recordedBy: healthMetrics.recordedByName,
          recordedAt: healthMetrics.createdAt,
          notes: healthMetrics.notes
        }
      }
    });

  } catch (error) {
    console.error('Error adding health metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get latest health metrics for a patient
export const getLatestHealthMetrics = async (req, res) => {
  try {
    const { abhaId } = req.params;

    console.log('Getting latest health metrics for patient:', abhaId);

    // Find patient by ABHA ID
    const patient = await Patient.findOne({ abhaId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get latest health metrics
    const latestMetrics = await HealthMetrics.findOne({ abhaId })
      .sort({ createdAt: -1 })
      .populate('recordedBy', 'name email');

    if (!latestMetrics) {
      return res.status(404).json({
        success: false,
        message: 'No health metrics found for this patient'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Health metrics retrieved successfully',
      data: {
        healthMetrics: {
          id: latestMetrics._id,
          patientId: patient._id,
          abhaId: abhaId,
          bloodPressure: {
            value: `${latestMetrics.bloodPressure.systolic}/${latestMetrics.bloodPressure.diastolic}`,
            systolic: latestMetrics.bloodPressure.systolic,
            diastolic: latestMetrics.bloodPressure.diastolic,
            status: latestMetrics.status.bloodPressure
          },
          heartRate: {
            value: `${latestMetrics.heartRate.value} ${latestMetrics.heartRate.unit}`,
            bpm: latestMetrics.heartRate.value,
            status: latestMetrics.status.heartRate
          },
          bloodSugar: {
            value: `${latestMetrics.bloodSugar.value} ${latestMetrics.bloodSugar.unit}`,
            mgdL: latestMetrics.bloodSugar.value,
            status: latestMetrics.status.bloodSugar
          },
          weight: {
            value: `${latestMetrics.weight.value} ${latestMetrics.weight.unit}`,
            kg: latestMetrics.weight.value,
            status: latestMetrics.status.weight
          },
          recordedBy: latestMetrics.recordedByName,
          recordedAt: latestMetrics.createdAt,
          notes: latestMetrics.notes
        }
      }
    });

  } catch (error) {
    console.error('Error getting health metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get health metrics history for a patient
export const getHealthMetricsHistory = async (req, res) => {
  try {
    const { abhaId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    console.log('Getting health metrics history for patient:', abhaId);

    // Find patient by ABHA ID
    const patient = await Patient.findOne({ abhaId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get health metrics history with pagination
    const skip = (page - 1) * limit;
    const healthMetrics = await HealthMetrics.find({ abhaId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('recordedBy', 'name email');

    const total = await HealthMetrics.countDocuments({ abhaId });

    res.status(200).json({
      success: true,
      message: 'Health metrics history retrieved successfully',
      data: {
        healthMetrics: healthMetrics.map(metric => ({
          id: metric._id,
          bloodPressure: {
            value: `${metric.bloodPressure.systolic}/${metric.bloodPressure.diastolic}`,
            status: metric.status.bloodPressure
          },
          heartRate: {
            value: `${metric.heartRate.value} ${metric.heartRate.unit}`,
            status: metric.status.heartRate
          },
          bloodSugar: {
            value: `${metric.bloodSugar.value} ${metric.bloodSugar.unit}`,
            status: metric.status.bloodSugar
          },
          weight: {
            value: `${metric.weight.value} ${metric.weight.unit}`,
            status: metric.status.weight
          },
          recordedBy: metric.recordedByName,
          recordedAt: metric.createdAt,
          notes: metric.notes
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: skip + healthMetrics.length < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error getting health metrics history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update health metrics
export const updateHealthMetrics = async (req, res) => {
  try {
    const { metricsId } = req.params;
    const { bloodPressure, heartRate, bloodSugar, weight, notes } = req.body;

    console.log('Updating health metrics:', metricsId);

    const healthMetrics = await HealthMetrics.findById(metricsId);
    if (!healthMetrics) {
      return res.status(404).json({
        success: false,
        message: 'Health metrics not found'
      });
    }

    // Update fields if provided
    if (bloodPressure) {
      healthMetrics.bloodPressure = {
        systolic: parseInt(bloodPressure.systolic),
        diastolic: parseInt(bloodPressure.diastolic)
      };
    }
    if (heartRate) {
      healthMetrics.heartRate = {
        value: parseInt(heartRate),
        unit: 'bpm'
      };
    }
    if (bloodSugar) {
      healthMetrics.bloodSugar = {
        value: parseInt(bloodSugar),
        unit: 'mg/dL'
      };
    }
    if (weight) {
      healthMetrics.weight = {
        value: parseInt(weight),
        unit: 'kg'
      };
    }
    if (notes !== undefined) {
      healthMetrics.notes = notes;
    }

    await healthMetrics.save();

    res.status(200).json({
      success: true,
      message: 'Health metrics updated successfully',
      data: {
        healthMetrics: {
          id: healthMetrics._id,
          bloodPressure: healthMetrics.bloodPressure,
          heartRate: healthMetrics.heartRate,
          bloodSugar: healthMetrics.bloodSugar,
          weight: healthMetrics.weight,
          status: healthMetrics.status,
          recordedBy: healthMetrics.recordedByName,
          recordedAt: healthMetrics.createdAt,
          notes: healthMetrics.notes
        }
      }
    });

  } catch (error) {
    console.error('Error updating health metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
