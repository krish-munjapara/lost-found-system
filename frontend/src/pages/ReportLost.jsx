/**
 * Guardian-Link — Report Lost Page
 * Assembles the ReportForm component for missing child reporting.
 */

import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import ReportForm from '../components/report/ReportForm';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { childrenApi } from '../services/api';

const ReportLost = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      await childrenApi.reportLost(formData);
      setSubmitted(true);
      setProcessing(true);
      
      // Simulate processing time - in production, this would poll for actual status
      setTimeout(() => {
        setProcessing(false);
      }, 5000);
      
    } catch (err) {
      alert(err.message || 'Failed to submit report');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMatches = () => {
    navigate('/matches');
  };

  const handleViewMyReports = () => {
    navigate('/missing-children');
  };

  return (
    <Layout>
      {!submitted ? (
        <ReportForm
          type="missing"
          icon={AlertCircle}
          onSubmit={handleSubmit}
          loading={loading}
        />
      ) : processing ? (
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">AI Matching in Progress</h3>
          <p className="text-slate-500 max-w-md">
            Your report has been submitted successfully. AI is now analyzing the image and searching for potential matches. This may take a few moments.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Report Submitted Successfully</h3>
          <p className="text-slate-500 max-w-md mb-6">
            Your report has been saved and AI matching has been initiated. Matches will appear in your matches page when found.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleViewMatches}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              View Matches
            </button>
            <button
              onClick={handleViewMyReports}
              className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
            >
              View My Reports
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ReportLost;
