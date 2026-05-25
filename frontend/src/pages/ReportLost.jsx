/**
 * Guardian-Link — Report Lost Page
 * Assembles the ReportForm component for missing child reporting.
 */

import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import ReportForm from '../components/report/ReportForm';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { childrenApi } from '../services/api';

const ReportLost = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      await childrenApi.reportLost(formData);
      navigate('/missing-children');
    } catch (err) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <ReportForm
        type="missing"
        icon={AlertCircle}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </Layout>
  );
};

export default ReportLost;
