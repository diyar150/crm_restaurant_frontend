import { useState } from 'react';
import axiosInstance from '../components/service/axiosInstance';
import { BASE_URL } from '../config/constants';

export function useCompanyInfo() {
  const [company, setCompany] = useState(null);

  const fetchCompanyInfo = async () => {
    try {
      const res = await axiosInstance.get('company/last-insert-id');
      if (res.data.id) {
        const companyRes = await axiosInstance.get(`company/show/${res.data.id}`);
        setCompany({
          ...companyRes.data,
          logo_1: companyRes.data.logo_1
            ? `${BASE_URL}${companyRes.data.logo_1}`
            : '',
        });
      }
    } catch (e) {
      setCompany(null);
    }
  };

  return { company, fetchCompanyInfo, setCompany };
}