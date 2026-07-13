import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { createVenue, uploadVenueImages } from '../firebase/venueService';
import VenueCardPreview from '../components/VenueCardPreview';
import FeatureLocked from '../components/FeatureLocked';
import { Input, Textarea } from '../components/ui/Field';
import { buttonClasses } from '../components/ui/Button';
import { useError } from '../context/ErrorContext';
import { useSubscription } from '../hooks/useSubscription';

const inputClass = 'py-3 text-base';
const labelClass =
  'text-sm font-semibold uppercase tracking-wider text-content-muted';
const stepTitleClass =
  'mb-4 font-display text-3xl font-bold tracking-tight text-content';

function CreateVenue() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useError();
  // Tier comes from the owner's existing venue (first-time creators
  // have none → trial → premium styling stays locked).
  const { activeVenue } = useOutletContext() || {};
  const { customBorders } = useSubscription(
    activeVenue && activeVenue.subscriptionTier
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);

  // Aligned perfectly with types.ts
  const [venueData, setVenueData] = useState({
    title: '',
    address: '',
    phone: '',
    website: '',
    categories: [], // Up to MAX_CATEGORIES; first one is the primary
    images: [],
    description: '',
    cardBorderStyle: 'default',
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

      showSuccess('Draft saved successfully!');
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
      venueData.categories.length === 0 ||
      !venueData.phone
    ) {
      showError(
        'Please fill in Title, Address, Phone, and at least one Category.'
      );
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
          // First selection doubles as the primary category (the
          // consumer app still reads the singular field).
          category: venueData.categories[0] || '',
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

      showSuccess('Venue created successfully!');
      navigate('/dashboard');
    } catch (error) {
      showError(`Failed to create venue: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 gap-8 bg-surface p-8 max-lg:flex-col">
      <div className="flex w-1/2 items-center justify-center max-lg:w-full">
        <VenueCardPreview venueData={venueData} currentStep={currentStep} />
      </div>

      <div className="flex w-1/2 flex-col overflow-hidden rounded-2xl border border-edge bg-surface-raised shadow-card max-lg:w-full">
        {/* Focus Mode Escape Hatch */}
        <div className="flex items-center justify-between border-b border-edge bg-surface-overlay px-10 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-content-faint transition-colors hover:text-primary"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back to Dashboard
          </button>
          <span className="font-display font-semibold tracking-wider text-content">
            Venue Setup
          </span>
        </div>

        <div className="mb-5 flex items-center justify-between gap-6 px-10 pt-6">
          <div className="flex flex-1 gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition ${
                  currentStep >= step ? 'bg-primary' : 'bg-content/10'
                }`}
              />
            ))}
          </div>
          <button
            className={buttonClasses('secondary', 'sm', 'shrink-0')}
            onClick={handleSaveDraft}
          >
            Save Draft
          </button>
        </div>

        <div className="px-10">
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
              customBorders={customBorders}
            />
          )}
        </div>

        <div className="mt-auto flex items-center justify-end gap-4 px-10 py-6">
          {currentStep > 1 && (
            <button
              className={buttonClasses('secondary', 'lg', 'mr-auto')}
              onClick={goToPreviousStep}
            >
              Back
            </button>
          )}
          {currentStep < 4 ? (
            <button
              className={buttonClasses('primary', 'lg')}
              onClick={goToNextStep}
            >
              Next
            </button>
          ) : (
            <button
              className={buttonClasses('primary', 'lg')}
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
    <div className="flex flex-col gap-4">
      <h1 className={stepTitleClass}>Venue Identity & Contact</h1>
      <Input
        type="text"
        className={inputClass}
        placeholder="Venue Name"
        value={venueData.title}
        onChange={(e) => updateVenueData('title', e.target.value)}
      />
      <Input
        type="text"
        className={inputClass}
        placeholder="Full Address"
        value={venueData.address}
        onChange={(e) => updateVenueData('address', e.target.value)}
      />
      <Input
        type="tel"
        className={inputClass}
        placeholder="Public Phone Number"
        value={venueData.phone}
        onChange={(e) => updateVenueData('phone', e.target.value)}
      />
      <Input
        type="url"
        className={inputClass}
        placeholder="Website URL"
        value={venueData.website}
        onChange={(e) => updateVenueData('website', e.target.value)}
      />
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
  // Triggers the FPB X18 compliance flow in Settings → Legal & Compliance.
  'adult entertainment',
];

const MAX_CATEGORIES = 3;

function Step2Category({ venueData, updateVenueData }) {
  const selected = venueData.categories;
  const atLimit = selected.length >= MAX_CATEGORIES;

  const toggleCategory = (cat) => {
    if (selected.includes(cat)) {
      updateVenueData(
        'categories',
        selected.filter((c) => c !== cat)
      );
    } else if (!atLimit) {
      updateVenueData('categories', [...selected, cat]);
    }
  };

  return (
    <div className="flex flex-col">
      <h1 className={stepTitleClass}>Venue Categories</h1>
      <p className="mb-4 text-sm text-content-faint">
        Select up to {MAX_CATEGORIES} categories — the first pick is your
        primary ({selected.length}/{MAX_CATEGORIES} selected)
      </p>
      <div className="grid grid-cols-3 gap-3 max-md:grid-cols-2">
        {VENUE_CATEGORIES.map((cat) => {
          const isSelected = selected.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              data-testid={`category-${cat.replace(/\s+/g, '-')}`}
              disabled={!isSelected && atLimit}
              className={`rounded-lg border px-4 py-3 font-medium capitalize transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary shadow-glow-primary'
                  : 'border-edge bg-surface text-content-muted hover:border-edge-strong'
              }`}
              onClick={() => toggleCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          );
        })}
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
    <div className="flex flex-col">
      <h1 className={stepTitleClass}>High-Resolution Media</h1>
      {uploadError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <ExclamationTriangleIcon
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          {uploadError}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={`image-${index}`} className="aspect-square">
            {imageFiles[index] ? (
              <div className="relative h-full w-full overflow-hidden rounded-xl border border-edge">
                <img
                  src={URL.createObjectURL(imageFiles[index])}
                  alt={`Upload ${index}`}
                  className="h-full w-full object-cover"
                />
                <button
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-danger"
                  onClick={() => removeImage(index)}
                  aria-label="Remove image"
                >
                  <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label
                className="flex h-full w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-edge-strong bg-surface transition hover:border-primary/60 hover:bg-primary/5"
                htmlFor={`image-upload-${index}`}
              >
                <PlusIcon
                  className="h-8 w-8 text-content-faint"
                  aria-hidden="true"
                />
                <input
                  id={`image-upload-${index}`}
                  type="file"
                  accept="image/*"
                  multiple={index === 0}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Premium swipe-card border options (Pro+). Keys persist to
// venue.cardBorderStyle and drive VenueCardPreview's live shell.
// Never rename the keys — they are stored in Firestore documents.
const BORDER_STYLES = [
  {
    key: 'default',
    name: 'Default',
    description: 'Clean dark card',
    swatchClass: 'border-edge-strong',
  },
  {
    key: 'neon-glow',
    name: 'Neon Glow',
    description: 'Coral ring & glow',
    swatchClass: 'border-primary shadow-glow-primary',
  },
  {
    key: 'gold-trim',
    name: 'Gold Trim',
    description: 'Gold ring & glow',
    swatchClass: 'border-[#FFB84D] shadow-glow-gold',
  },
];

function BorderStyleGrid({ venueData, updateVenueData }) {
  return (
    <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
      {BORDER_STYLES.map((style) => (
        <button
          key={style.key}
          type="button"
          data-testid={`border-style-${style.key}`}
          className={`flex flex-col items-center gap-2 rounded-lg border px-4 py-4 transition ${
            venueData.cardBorderStyle === style.key
              ? 'border-primary bg-primary/10 shadow-glow-primary'
              : 'border-edge bg-surface hover:border-edge-strong'
          }`}
          onClick={() => updateVenueData('cardBorderStyle', style.key)}
        >
          <span
            className={`h-10 w-16 rounded-lg border-2 bg-surface-overlay ${style.swatchClass}`}
          />
          <span className="text-sm font-medium text-content">
            {style.name}
          </span>
          <span className="text-xs text-content-faint">
            {style.description}
          </span>
        </button>
      ))}
    </div>
  );
}

function Step4Operations({ venueData, updateVenueData, customBorders }) {
  const handleSocialChange = (platform, value) => {
    updateVenueData('socialLinks', {
      ...venueData.socialLinks,
      [platform]: value,
    });
  };

  return (
    <div className="flex max-h-[60vh] flex-col gap-6 overflow-y-auto pr-2.5">
      <h1 className={stepTitleClass}>Operations & Socials</h1>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Description:</label>
        <Textarea
          className={`${inputClass} resize-y`}
          placeholder="Detail your venue's atmosphere, dress code, and minimum spends..."
          value={venueData.description}
          onChange={(e) => updateVenueData('description', e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Social Links:</label>
        <Input
          type="url"
          className={inputClass}
          placeholder="Instagram URL"
          value={venueData.socialLinks.instagram}
          onChange={(e) => handleSocialChange('instagram', e.target.value)}
        />
        <Input
          type="url"
          className={inputClass}
          placeholder="Facebook URL"
          value={venueData.socialLinks.facebook}
          onChange={(e) => handleSocialChange('facebook', e.target.value)}
        />
        <Input
          type="url"
          className={inputClass}
          placeholder="TikTok URL"
          value={venueData.socialLinks.tiktok}
          onChange={(e) => handleSocialChange('tiktok', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <label className={labelClass}>Premium Card Styling:</label>
        {customBorders ? (
          <BorderStyleGrid
            venueData={venueData}
            updateVenueData={updateVenueData}
          />
        ) : (
          <FeatureLocked
            variant="compact"
            requiredTier="pro"
            featureName="Premium Card Styling"
          >
            <BorderStyleGrid
              venueData={venueData}
              updateVenueData={updateVenueData}
            />
          </FeatureLocked>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>
          Hours (Configure in Dashboard Settings later):
        </label>
        <p className="text-sm text-content-faint">
          Detailed daily hours can be configured post-launch.
        </p>
      </div>
    </div>
  );
}

export default CreateVenue;
