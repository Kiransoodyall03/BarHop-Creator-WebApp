import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createVenue, uploadVenueImages } from '../firebase/venueService';
import VenueCardPreview from '../components/VenueCardPreview';
import '../styles/CreateVenue.css';
import { useError } from '../context/ErrorContext';

function CreateVenue() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { showError } = useError();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);

  // Aligned perfectly with types.ts
  const [venueData, setVenueData] = useState({
    title: '',
    address: '',
    phone: '',
    website: '',
    category: '', // Single string instead of array
    images: [],
    description: '',
    socialLinks: {
      instagram: '',
      facebook: '',
      tiktok: '',
    },
    hours: {
      monday: { open: '', close: '', closed: false },
      tuesday: { open: '', close: '', closed: false },
      wednesday: { open: '', close: '', closed: false },
      thursday: { open: '', close: '', closed: false },
      friday: { open: '', close: '', closed: false },
      saturday: { open: '', close: '', closed: false },
      sunday: { open: '', close: '', closed: false },
    },
  });

  const updateVenueData = (field, value) => {
    setVenueData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveDraft = async () => {
    try {
      const { getFirestore, doc, setDoc } = await import('firebase/firestore');
      const db = getFirestore();
      const draftId = `draft_${currentUser.uid}_${Date.now()}`;

      await setDoc(doc(db, 'venue_drafts', draftId), {
        ...venueData,
        name: venueData.title,
        ownerId: currentUser.uid,
        currentStep,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      alert('✅ Draft saved successfully!');
    } catch (error) {
      showError('Failed to save draft. Please try again.');
    }
  };

  const goToNextStep = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (
      !venueData.title ||
      !venueData.address ||
      !venueData.category ||
      !venueData.phone
    ) {
      showError('Please fill in Title, Address, Phone, and Category.');
      return;
    }

    if (imageFiles.length === 0) {
      showError('Please upload at least one image.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create B2B venue document
      const venueId = await createVenue(
        {
          ...venueData,
          name: venueData.title,
          images: [], // Populated after upload
        },
        currentUser.uid
      );

      // Step 2: Upload images
      let imageUrls = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadVenueImages(imageFiles, venueId);
      }

      // Step 3: Update document with URLs
      const { getFirestore, doc, updateDoc } =
        await import('firebase/firestore');
      const db = getFirestore();
      await updateDoc(doc(db, 'venues', venueId), {
        images: imageUrls,
      });

      alert('✅ Venue created successfully!');
      navigate('/dashboard');
    } catch (error) {
      showError(`Failed to create venue: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    // We removed <main className="dashboard-main"> from here.
    // The create-venue-page div is now the root of this component.
    <div className="create-venue-page">
      <div className="preview-section">
        <VenueCardPreview venueData={venueData} currentStep={currentStep} />
      </div>

      <div className="form-section">
        {/* Focus Mode Escape Hatch */}
        <div
          style={{
            padding: '1.5rem 2.5rem',
            borderBottom: '1px solid #222',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#121212',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: 0,
            }}
          >
            <span>←</span> Back to Dashboard
          </button>
          <span
            style={{
              color: '#fff',
              fontWeight: '600',
              letterSpacing: '0.05em',
            }}
          >
            Venue Setup
          </span>
        </div>

        <div
          className="form-header"
          style={{ padding: '1.5rem 2.5rem 0', marginBottom: '20px' }}
        >
          <div className="progress-steps">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`progress-step ${currentStep >= step ? 'active' : ''}`}
              />
            ))}
          </div>
          <button className="save-draft-btn" onClick={handleSaveDraft}>
            Save Draft
          </button>
        </div>

        <div className="step-content" style={{ padding: '0 2.5rem' }}>
          {currentStep === 1 && (
            <Step1Identity
              venueData={venueData}
              updateVenueData={updateVenueData}
            />
          )}
          {currentStep === 2 && (
            <Step2Category
              venueData={venueData}
              updateVenueData={updateVenueData}
            />
          )}
          {currentStep === 3 && (
            <Step3Images
              updateVenueData={updateVenueData}
              imageFiles={imageFiles}
              setImageFiles={setImageFiles}
            />
          )}
          {currentStep === 4 && (
            <Step4Operations
              venueData={venueData}
              updateVenueData={updateVenueData}
            />
          )}
        </div>

        <div className="form-navigation" style={{ padding: '1.5rem 2.5rem' }}>
          {currentStep > 1 && (
            <button className="back-btn" onClick={goToPreviousStep}>
              Back
            </button>
          )}
          {currentStep < 4 ? (
            <button className="next-btn" onClick={goToNextStep}>
              Next
            </button>
          ) : (
            <button
              className="done-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Creating Profile...' : 'Launch Venue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- STEPS COMPONENTS ---

function Step1Identity({ venueData, updateVenueData }) {
  return (
    <div className="step-container">
      <h1 className="step-title">Venue Identity & Contact</h1>
      <div className="form-group">
        <input
          type="text"
          className="form-input-large"
          placeholder="Venue Name"
          value={venueData.title}
          onChange={(e) => updateVenueData('title', e.target.value)}
        />
      </div>
      <div className="form-group">
        <input
          type="text"
          className="form-input-large"
          placeholder="Full Address"
          value={venueData.address}
          onChange={(e) => updateVenueData('address', e.target.value)}
        />
      </div>
      <div className="form-group">
        <input
          type="tel"
          className="form-input-large"
          placeholder="Public Phone Number"
          value={venueData.phone}
          onChange={(e) => updateVenueData('phone', e.target.value)}
        />
      </div>
      <div className="form-group">
        <input
          type="url"
          className="form-input-large"
          placeholder="Website URL"
          value={venueData.website}
          onChange={(e) => updateVenueData('website', e.target.value)}
        />
      </div>
    </div>
  );
}

const VENUE_CATEGORIES = [
  'bar',
  'club',
  'restaurant',
  'lounge',
  'rooftop',
  'sports bar',
];

function Step2Category({ venueData, updateVenueData }) {
  return (
    <div className="step-container">
      <h1 className="step-title">Primary Category</h1>
      <p className="category-counter">
        Select the core operational category (1 max)
      </p>
      <div className="category-grid">
        {VENUE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`category-button ${venueData.category === cat ? 'selected' : ''}`}
            onClick={() => updateVenueData('category', cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3Images({ updateVenueData, imageFiles, setImageFiles }) {
  const [uploadError, setUploadError] = useState('');

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadError('');
    const remainingSlots = 4 - imageFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      setUploadError(
        `Only ${remainingSlots} more image(s) can be added (max 4).`
      );
    }

    const newImageFiles = [...imageFiles, ...filesToAdd];
    setImageFiles(newImageFiles);
    updateVenueData(
      'images',
      newImageFiles.map((file) => URL.createObjectURL(file))
    );
  };

  const removeImage = (index) => {
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newImageFiles);
    updateVenueData(
      'images',
      newImageFiles.map((file) => URL.createObjectURL(file))
    );
  };

  return (
    <div className="step-container">
      <h1 className="step-title">High-Resolution Media</h1>
      {uploadError && <div className="upload-error">⚠️ {uploadError}</div>}
      <div className="upload-grid">
        {[0, 1, 2, 3].map((index) => (
          <div key={`image-${index}`} className="upload-slot">
            {imageFiles[index] ? (
              <div className="upload-preview">
                <img
                  src={URL.createObjectURL(imageFiles[index])}
                  alt={`Upload ${index}`}
                  className="preview-image"
                />
                <button
                  className="remove-upload-btn"
                  onClick={() => removeImage(index)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label
                className="upload-placeholder"
                htmlFor={`image-upload-${index}`}
              >
                <div className="upload-icon">+</div>
                <input
                  id={`image-upload-${index}`}
                  type="file"
                  accept="image/*"
                  multiple={index === 0}
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Step4Operations({ venueData, updateVenueData }) {
  const handleSocialChange = (platform, value) => {
    updateVenueData('socialLinks', {
      ...venueData.socialLinks,
      [platform]: value,
    });
  };

  return (
    <div
      className="step-container"
      style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}
    >
      <h1 className="step-title">Operations & Socials</h1>

      <div className="form-group">
        <label className="form-label-inline">Description:</label>
        <textarea
          className="form-textarea"
          placeholder="Detail your venue's atmosphere, dress code, and minimum spends..."
          value={venueData.description}
          onChange={(e) => updateVenueData('description', e.target.value)}
          rows={4}
        />
      </div>

      <div className="form-group">
        <label className="form-label-inline">Social Links:</label>
        <input
          type="url"
          className="form-input-large"
          placeholder="Instagram URL"
          value={venueData.socialLinks.instagram}
          onChange={(e) => handleSocialChange('instagram', e.target.value)}
          style={{ marginBottom: '0.5rem' }}
        />
        <input
          type="url"
          className="form-input-large"
          placeholder="Facebook URL"
          value={venueData.socialLinks.facebook}
          onChange={(e) => handleSocialChange('facebook', e.target.value)}
          style={{ marginBottom: '0.5rem' }}
        />
        <input
          type="url"
          className="form-input-large"
          placeholder="TikTok URL"
          value={venueData.socialLinks.tiktok}
          onChange={(e) => handleSocialChange('tiktok', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label-inline">
          Hours (Configure in Dashboard Settings later):
        </label>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          Detailed daily hours can be configured post-launch.
        </p>
      </div>
    </div>
  );
}

export default CreateVenue;
