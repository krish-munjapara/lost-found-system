/**
 * Guardian-Link — Report Found Page
 * Assembles the ReportForm component for found child reporting.
 */

import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import ReportForm from '../components/report/ReportForm';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { childrenApi } from '../services/api';

const ReportFound = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      await childrenApi.reportFound(formData);
      navigate('/found-children');
    } catch (err) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <ReportForm
        type="found"
        icon={ShieldCheck}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </Layout>
  );
};

export default ReportFound;
