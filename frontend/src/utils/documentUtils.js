import axios from 'axios';
import { API_BASE_URL } from '../config';

// Shared document loading utility
export const loadUserDocuments = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const response = await axios.get(`${API_BASE_URL}/documents/${userId}`);
  return response.data;
};

// Shared document data transformation
export const transformDocumentData = (documents) => {
  return documents.map(doc => ({
    id: doc.id,
    name: doc.filename,
    filename: doc.filename,
    date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    url: `/documents/${doc.id}/download`,
    hasTranslation: doc.has_translation
  }));
};

// Split documents into recent and previous
export const splitDocuments = (documents, recentCount = 3) => {
  return {
    recent: documents.slice(0, recentCount),
    previous: documents.slice(recentCount)
  };
};
