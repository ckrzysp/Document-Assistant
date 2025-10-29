import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadUserDocuments, transformDocumentData } from '../utils/documentUtils';

export const useDocuments = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDocuments = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const rawDocuments = await loadUserDocuments(userId);
      const transformedDocuments = transformDocumentData(rawDocuments);
      setDocuments(transformedDocuments);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  return {
    documents,
    loading,
    error,
    reloadDocuments: loadDocuments
  };
};
