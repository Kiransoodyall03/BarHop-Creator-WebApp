import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { createVenue, uploadVenueImages } from '../firebase/venueService';
import { searchFoursquarePlaces } from '../firebase/foursquareService';
import VenueCardPreview from '../components/VenueCardPreview';
import FeatureLocked from '../components/FeatureLocked';
import {
  BrandInput,
  BrandLabel,
  BrandTextarea,
  PageShell,
  PANEL,
  RING_SETS,
  SegmentedRule,
  WELL,
  brandButton,
} from '../components/ui/Brand';
import { useError } from '../context/ErrorContext';
import { useSubscription } from '../hooks/useSubscription';

const stepTitleClass =
  'font-display text-2xl font-bold tracking-tight text-white sm:text-3xl';

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
    placeId: '', // Foursquare fsq_place_id — set once ownership is confirmed
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
    if (currentStep === 1 && !venueData.placeId) {
      showError(
        'Find and select your venue on Foursquare to confirm ownership.'
      );
      return;
    }
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!venueData.placeId) {
      showError('Confirm your venue on Foursquare in Step 1 to launch.');
      setCurrentStep(1);
      return;
    }

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
    <PageShell rings={RING_SETS.split} width="max-w-7xl">
      <div className="flex gap-8 max-lg:flex-col">
        <div className="flex w-1/2 items-center justify-center max-lg:w-full">
          <VenueCardPreview venueData={venueData} currentStep={currentStep} />
        </div>

        <div
          className={`${PANEL} flex w-1/2 flex-col gap-6 p-8 max-lg:w-full max-md:p-6`}
        >
          {/* Focus Mode Escape Hatch */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 font-mono text-sm text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              Back to Dashboard
            </button>
            <span className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Venue Setup
            </span>
          </div>

          <SegmentedRule variant="warm" />

          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-1 gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition ${
                    currentStep >= step ? 'bg-brand-warm' : 'bg-white/15'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              className={brandButton('outline', 'sm', 'shrink-0')}
              onClick={handleSaveDraft}
            >
              Save Draft
            </button>
          </div>

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

          <div className="mt-auto flex items-center justify-end gap-4 pt-2">
            {currentStep > 1 && (
              <button
                type="button"
                className={brandButton('outline', 'lg', 'mr-auto')}
                onClick={goToPreviousStep}
              >
                Back
              </button>
            )}
            {currentStep < 4 ? (
              <button
                type="button"
                className={brandButton('primary', 'lg')}
                onClick={goToNextStep}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className={brandButton('primary', 'lg')}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Creating Profile...' : 'Launch Venue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// --- STEPS COMPONENTS ---

function Step1Identity({ venueData, updateVenueData }) {
  const [query, setQuery] = useState(venueData.title || '');
  const [area, setArea] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const runSearch = async () => {
    if (!query.trim()) {
      setSearchError('Enter your venue name to search.');
      return;
    }
    setSearching(true);
    setSearchError('');
    try {
      const found = await searchFoursquarePlaces({
        query: query.trim(),
        near: area.trim(),
      });
      setResults(found);
      if (found.length === 0) {
        setSearchError('No matches. Try adding the suburb or city.');
      }
    } catch (err) {
      setSearchError('Place search is unavailable right now. Try again.');
    } finally {
      setSearching(false);
    }
  };

  const selectPlace = (place) => {
    updateVenueData('placeId', place.placeId);
    updateVenueData('title', place.name);
    if (place.address) updateVenueData('address', place.address);
    setResults([]);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className={stepTitleClass}>Venue Identity &amp; Contact</h1>

      {venueData.placeId ? (
        <div
          className={`${WELL} flex items-start justify-between gap-3 border-brand-green/40`}
        >
          <div className="flex items-start gap-2">
            <CheckBadgeIcon
              className="mt-0.5 h-5 w-5 shrink-0 text-brand-green"
              aria-hidden="true"
            />
            <div>
              <p className="font-mono text-sm font-bold text-white">
                Ownership confirmed on Foursquare
              </p>
              <p className="font-mono text-sm text-white/60">
                {venueData.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="font-mono text-sm font-bold text-brand-orange hover:underline"
            onClick={() => updateVenueData('placeId', '')}
          >
            Change
          </button>
        </div>
      ) : (
        <div className={`${WELL} flex flex-col gap-3`}>
          <div>
            <p className="font-mono text-sm font-bold text-white">
              Find your venue to confirm ownership
            </p>
            <p className="font-mono text-xs text-white/55">
              We match your Foursquare listing so your card links to the
              consumer app. Required to launch.
            </p>
          </div>
          <BrandInput
            type="text"
            placeholder="Venue name (e.g. The Living Room)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <BrandInput
            type="text"
            placeholder="Suburb / city (e.g. Maboneng, Johannesburg)"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
          <button
            type="button"
            className={brandButton('outline', 'sm', 'self-start')}
            onClick={runSearch}
            disabled={searching}
          >
            {searching ? 'Searching…' : 'Search Foursquare'}
          </button>

          {searchError && (
            <p className="font-mono text-sm text-brand-pink">{searchError}</p>
          )}

          {results.length > 0 && (
            <ul className="flex flex-col gap-2">
              {results.map((place) => (
                <li key={place.placeId}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-white/15 bg-white/[0.06] px-4 py-3 text-left transition hover:border-brand-orange"
                    onClick={() => selectPlace(place)}
                  >
                    <p className="font-mono text-sm font-bold text-white">
                      {place.name}
                    </p>
                    {place.address && (
                      <p className="font-mono text-xs text-white/55">
                        {place.address}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <BrandInput
        type="text"
        placeholder="Venue Name"
        value={venueData.title}
        onChange={(e) => updateVenueData('title', e.target.value)}
      />
      <BrandInput
        type="text"
        placeholder="Full Address"
        value={venueData.address}
        onChange={(e) => updateVenueData('address', e.target.value)}
      />
      <BrandInput
        type="tel"
        placeholder="Public Phone Number"
        value={venueData.phone}
        onChange={(e) => updateVenueData('phone', e.target.value)}
      />
      <BrandInput
        type="url"
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
      <p className="mb-4 mt-2 font-mono text-sm text-white/55">
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
              className={`rounded-lg border px-4 py-3 font-mono text-sm capitalize transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? 'border-transparent bg-brand-warm font-bold text-white'
                  : 'border-white/20 bg-white/[0.06] text-white/70 hover:border-white/45 hover:text-white'
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
      <h1 className={`${stepTitleClass} mb-4`}>High-Resolution Media</h1>
      {uploadError && (
        <div
          className={`${WELL} mb-4 flex items-start gap-2 border-brand-pink/50 font-mono text-sm text-brand-pink`}
        >
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
              <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/15">
                <img
                  src={URL.createObjectURL(imageFiles[index])}
                  alt={`Upload ${index}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-brand-pink"
                  onClick={() => removeImage(index)}
                  aria-label="Remove image"
                >
                  <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label
                className="flex h-full w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/25 bg-white/[0.04] transition hover:border-brand-orange hover:bg-white/[0.08]"
                htmlFor={`image-upload-${index}`}
              >
                <PlusIcon className="h-8 w-8 text-white/40" aria-hidden="true" />
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
    swatchClass: 'border-white/30',
  },
  {
    key: 'neon-glow',
    name: 'Neon Glow',
    description: 'Coral ring & glow',
    swatchClass: 'border-brand-pink shadow-[0_0_18px_rgba(231,59,90,0.55)]',
  },
  {
    key: 'gold-trim',
    name: 'Gold Trim',
    description: 'Gold ring & glow',
    swatchClass: 'border-brand-orange shadow-[0_0_18px_rgba(243,113,16,0.55)]',
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
              ? 'border-brand-orange bg-white/[0.08]'
              : 'border-white/15 bg-white/[0.04] hover:border-white/35'
          }`}
          onClick={() => updateVenueData('cardBorderStyle', style.key)}
        >
          <span
            className={`h-10 w-16 rounded-lg border-2 bg-black/40 ${style.swatchClass}`}
          />
          <span className="font-mono text-sm font-bold text-white">
            {style.name}
          </span>
          <span className="font-mono text-xs text-white/55">
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
      <h1 className={stepTitleClass}>Operations &amp; Socials</h1>

      <div className="flex flex-col gap-2">
        <BrandLabel>Description:</BrandLabel>
        <BrandTextarea
          className="resize-y"
          placeholder="Detail your venue's atmosphere, dress code, and minimum spends..."
          value={venueData.description}
          onChange={(e) => updateVenueData('description', e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <BrandLabel>Social Links:</BrandLabel>
        <BrandInput
          type="url"
          placeholder="Instagram URL"
          value={venueData.socialLinks.instagram}
          onChange={(e) => handleSocialChange('instagram', e.target.value)}
        />
        <BrandInput
          type="url"
          placeholder="Facebook URL"
          value={venueData.socialLinks.facebook}
          onChange={(e) => handleSocialChange('facebook', e.target.value)}
        />
        <BrandInput
          type="url"
          placeholder="TikTok URL"
          value={venueData.socialLinks.tiktok}
          onChange={(e) => handleSocialChange('tiktok', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <BrandLabel>Premium Card Styling:</BrandLabel>
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
        <BrandLabel>Hours (Configure in Dashboard Settings later):</BrandLabel>
        <p className="font-mono text-sm text-white/55">
          Detailed daily hours can be configured post-launch.
        </p>
      </div>
    </div>
  );
}

export default CreateVenue;
