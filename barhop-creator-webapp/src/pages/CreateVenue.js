import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createVenue, uploadVenueImages } from "../firebase/venueService";
import Navbar from "../components/Navbar";
import VenueCardPreview from "../components/VenueCardPreview";
import "../styles/CreateVenue.css";
import { useError } from "../context/ErrorContext";

function CreateVenue() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [venueData, setVenueData] = useState({
    title: "",
    address: "",
    categories: [],
    images: [],
    description: "",
    hours: {
      monday: { open: "", close: "", closed: false },
      tuesday: { open: "", close: "", closed: false },
      wednesday: { open: "", close: "", closed: false },
      thursday: { open: "", close: "", closed: false },
      friday: { open: "", close: "", closed: false },
      saturday: { open: "", close: "", closed: false },
      sunday: { open: "", close: "", closed: false },
    },
  });
  const { showError, showSuccess } = useError();
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null); // Add video state
  const [loading, setLoading] = useState(false);

  // Update venue data
  const updateVenueData = (field, value) => {
    setVenueData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save draft
  const handleSaveDraft = async () => {
    try {
      const { getFirestore, doc, setDoc } = await import("firebase/firestore");
      const db = getFirestore();
      
      const draftId = `draft_${currentUser.uid}_${Date.now()}`;
      
      await setDoc(doc(db, "venue_drafts", draftId), {
        ...venueData,
        name: venueData.title,
        ownerId: currentUser.uid,
        currentStep,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      alert("✅ Draft saved successfully!");
    } catch (error) {
      showError("Failed to save draft. Please try again.");
    }
  };

  // Navigation
  const goToNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Final submission
  const handleSubmit = async () => {
    // Validation
    if (!venueData.title || !venueData.address || venueData.categories.length === 0) {
      showError("Please fill in all required fields (Title, Address, Category)");
      return;
    }

    if (imageFiles.length === 0) {
      showError("Please upload at least one image");
      return;
    }

    if (!venueData.description) {
      showError("Please add a description");
      return;
    }

    setLoading(true);

    try {
      console.log("Creating venue...");
      
      // Step 1: Create venue document in Firestore (without media URLs yet)
      const venueId = await createVenue(
        {
          ...venueData,
          name: venueData.title,
          category: venueData.categories[0] || "", // Primary category
          images: [],
          video: null,
        },
        currentUser.uid
      );

      console.log("Venue created with ID:", venueId);

      // Step 2: Upload images to Firebase Storage
      let imageUrls = [];
      if (imageFiles.length > 0) {
        console.log("Uploading images...");
        imageUrls = await uploadVenueImages(imageFiles, venueId);
        console.log("Images uploaded:", imageUrls);
      }

      // Step 3: Upload video to Firebase Storage (if exists)
      let videoUrl = null;
      if (videoFile) {
        console.log("Uploading video...");
        const { uploadVenueVideo } = await import("../firebase/venueService");
        videoUrl = await uploadVenueVideo(videoFile, venueId);
        console.log("Video uploaded:", videoUrl);
      }

      // Step 4: Update venue document with media URLs
      const { getFirestore, doc, updateDoc } = await import("firebase/firestore");
      const db = getFirestore();
      await updateDoc(doc(db, "venues", venueId), {
        images: imageUrls,
        video: videoUrl,
        updatedAt: new Date(),
      });

      console.log("Venue updated with media URLs");

      alert("✅ Venue created successfully!");
      navigate("/dashboard");
      
    } catch (error) {
      showError(`Failed to create venue: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="create-venue-page">
        {/* Left Side - Card Preview */}
        <div className="preview-section">
          <VenueCardPreview venueData={venueData} currentStep={currentStep} />
        </div>

        {/* Right Side - Form */}
        <div className="form-section">
          {/* Header with Progress and Save Draft */}
          <div className="form-header">
            <div className="progress-steps">
              {[1, 2, 3, 4].map(step => (
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

          {/* Step Content */}
          <div className="step-content">
            {currentStep === 1 && (
              <Step1TitleAddress
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
                venueData={venueData}
                updateVenueData={updateVenueData}
                imageFiles={imageFiles}
                setImageFiles={setImageFiles}
                videoFile={videoFile}
                setVideoFile={setVideoFile}
              />
            )}

            {currentStep === 4 && (
              <Step4DescriptionHours
                venueData={venueData}
                updateVenueData={updateVenueData}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="form-navigation">
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
                {loading ? "Creating Venue..." : "Done"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Step 1 Component
function Step1TitleAddress({ venueData, updateVenueData }) {
  return (
    <div className="step-container">
      <h1 className="step-title">Your Journey Begins Here:</h1>

      <div className="form-group">
        <input
          type="text"
          className="form-input-large"
          placeholder="Your title here..."
          value={venueData.title}
          onChange={(e) => updateVenueData('title', e.target.value)}
        />
      </div>

      <div className="form-group">
        <div className="input-with-icon">
          <span className="input-icon">🔍</span>
          <input
            type="text"
            className="form-input-large with-icon"
            placeholder="Address Of Your Venue..."
            value={venueData.address}
            onChange={(e) => updateVenueData('address', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
  const VENUE_CATEGORIES = [
    "bar",
    "club",
    "restaurant",
    "karaoke",
    "lounge",
    "rooftop",
    "sports bar",
    "brewery",
    "wine bar",
    "cocktail bar",
    "pub",
    "other"
  ];
function Step2Category({ venueData, updateVenueData }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter categories based on search
  const filteredCategories = VENUE_CATEGORIES.filter(cat =>
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategorySelect = (category) => {
    const currentCategories = venueData.categories || [];
    
    // If already selected, remove it
    if (currentCategories.includes(category)) {
      updateVenueData('categories', currentCategories.filter(c => c !== category));
    } 
    // If not selected and less than 3, add it
    else if (currentCategories.length < 3) {
      updateVenueData('categories', [...currentCategories, category]);
    }
    // If already have 3, replace the last one
    else {
      const newCategories = [...currentCategories];
      newCategories[2] = category;
      updateVenueData('categories', newCategories);
    }
  };

  const isSelected = (category) => {
    return (venueData.categories || []).includes(category);
  };

  return (
    <div className="step-container">
      <h1 className="step-title">Describe your place</h1>

      {/* Selection Counter */}
      <p className="category-counter">
        {venueData.categories?.length || 0} / 3 categories selected
      </p>

      {/* Search Bar */}
      <div className="category-search-container">
        <input
          type="text"
          className="category-search"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Grid */}
      <div className="category-grid">
        {filteredCategories.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-button ${isSelected(category) ? 'selected' : ''}`}
            onClick={() => handleCategorySelect(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <p className="no-results">No categories found</p>
      )}
    </div>
  );
}

function Step3Images({ venueData, updateVenueData, imageFiles, setImageFiles, videoFile, setVideoFile }) {
  const [videoPreview, setVideoPreview] = useState(videoFile ? URL.createObjectURL(videoFile) : null);
  const [uploadError, setUploadError] = useState("");

  // Validate video
  const validateVideo = async (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        
        const duration = video.duration;
        const width = video.videoWidth;
        const height = video.videoHeight;

        // Check duration (7 seconds max)
        if (duration > 7) {
          reject(`Video is too long (${Math.round(duration)}s). Maximum is 7 seconds.`);
          return;
        }

        // Check resolution (1080p max)
        if (width > 1920 || height > 1080) {
          reject(`Video resolution too high (${width}x${height}). Maximum is 1920x1080.`);
          return;
        }

        resolve(true);
      };

      video.onerror = function() {
        reject('Invalid video file');
      };

      video.src = URL.createObjectURL(file);
    });
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadError("");

    // Limit total images to 3 (since we have 1 slot for video)
    const remainingSlots = 3 - imageFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      setUploadError(`Only ${remainingSlots} more image(s) can be added (max 3 images total)`);
    }

    // Create preview URLs
    const newImageFiles = [...imageFiles, ...filesToAdd];
    const imageUrls = newImageFiles.map(file => URL.createObjectURL(file));

    setImageFiles(newImageFiles);
    updateVenueData('images', imageUrls);
  };

  // Handle video upload
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError("");

    try {
      // Validate video
      await validateVideo(file);

      // If validation passes, set video
      const videoUrl = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoPreview(videoUrl);
    } catch (error) {
      setUploadError(error);
      e.target.value = ""; // Reset input
    }
  };

  // Remove image
  const removeImage = (index) => {
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    const imageUrls = newImageFiles.map(file => URL.createObjectURL(file));
    
    setImageFiles(newImageFiles);
    updateVenueData('images', imageUrls);
  };

  // Remove video
  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setUploadError("");
  };

  return (
    <div className="step-container">
      <h1 className="step-title">Add Images/Videos To Your Card:</h1>

      {uploadError && (
        <div className="upload-error">
          ⚠️ {uploadError}
        </div>
      )}

      {/* Upload Grid */}
      <div className="upload-grid">
        {/* Image Slots (3 max) */}
        {[0, 1, 2].map((index) => (
          <div key={`image-${index}`} className="upload-slot">
            {imageFiles[index] ? (
              <div className="upload-preview">
                <img 
                  src={URL.createObjectURL(imageFiles[index])} 
                  alt={`Upload ${index + 1}`}
                  className="preview-image"
                />
                <button 
                  className="remove-upload-btn"
                  onClick={() => removeImage(index)}
                >
                  ✕
                </button>
                <span className="upload-label">*Image</span>
              </div>
            ) : (
              <label className="upload-placeholder" htmlFor={`image-upload-${index}`}>
                <div className="upload-icon">+</div>
                <span className="upload-text">*Image</span>
                <input
                  id={`image-upload-${index}`}
                  type="file"
                  accept="image/*"
                  multiple={index === 0} // Only first slot allows multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        ))}

        {/* Video Slot (1 max) */}
        <div className="upload-slot">
          {videoPreview ? (
            <div className="upload-preview">
              <video 
                src={videoPreview} 
                className="preview-video"
                controls
                muted
              />
              <button 
                className="remove-upload-btn"
                onClick={removeVideo}
              >
                ✕
              </button>
              <span className="upload-label">*Video</span>
            </div>
          ) : (
            <label className="upload-placeholder" htmlFor="video-upload">
              <div className="upload-icon">+</div>
              <span className="upload-text">*Video</span>
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="upload-requirements">
        <p>• Images: Up to 3 images</p>
        <p>• Video: Max 7 seconds, 1080p resolution</p>
      </div>
    </div>
  );
}

function Step4DescriptionHours({ venueData, updateVenueData }) {
  const [description, setDescription] = useState(venueData.description || "");
  const maxChars = 500;

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Generate time options from 6 AM to 3 AM (next day)
  const generateTimeOptions = () => {
    const times = [];
    // 6 AM to 11:30 PM
    for (let hour = 6; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const time24 = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const time12 = `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
        times.push({ value: time24, label: time12 });
      }
    }
    // 12 AM to 3 AM (next day)
    for (let hour = 0; hour <= 3; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === 3 && min > 0) break; // Stop at 3:00 AM
        const displayHour = hour === 0 ? 12 : hour;
        const time24 = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const time12 = `${displayHour}:${min.toString().padStart(2, '0')} AM`;
        times.push({ value: time24, label: time12 });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setDescription(text);
      updateVenueData('description', text);
    }
  };

  const handleHoursChange = (day, field, value) => {
    const newHours = {
      ...venueData.hours,
      [day]: {
        ...venueData.hours[day],
        [field]: value
      }
    };
    updateVenueData('hours', newHours);
  };

  const copyToAllDays = () => {
    const templateDay = venueData.hours.monday;
    const newHours = {};
    daysOfWeek.forEach(day => {
      newHours[day] = { ...templateDay };
    });
    updateVenueData('hours', newHours);
  };

  const setWeekdayHours = () => {
    const weekdayTemplate = { open: "17:00", close: "02:00", closed: false }; // 5 PM - 2 AM
    const weekendTemplate = { open: "14:00", close: "03:00", closed: false }; // 2 PM - 3 AM
    
    const newHours = {
      monday: weekdayTemplate,
      tuesday: weekdayTemplate,
      wednesday: weekdayTemplate,
      thursday: weekdayTemplate,
      friday: weekendTemplate,
      saturday: weekendTemplate,
      sunday: { open: "14:00", close: "00:00", closed: false }, // 2 PM - 12 AM
    };
    updateVenueData('hours', newHours);
  };

  return (
    <div className="step-container">
      <h1 className="step-title">Now spill the tea:</h1>

      {/* Description */}
      <div className="form-group">
        <label className="form-label-inline">Description:</label>
        <textarea
          className="form-textarea"
          placeholder="Tell people about your venue..."
          value={description}
          onChange={handleDescriptionChange}
          rows={6}
        />
        <div className="char-counter">
          {description.length} / {maxChars} characters
        </div>
      </div>

      {/* Opening Hours */}
      <div className="form-group">
        <label className="form-label-inline">Opening times:</label>
        
        {/* Quick Actions */}
        <div className="hours-quick-actions">
          <button type="button" className="quick-action-btn" onClick={copyToAllDays}>
            Copy Monday to All Days
          </button>
          <button type="button" className="quick-action-btn" onClick={setWeekdayHours}>
            Set Typical Hours
          </button>
        </div>

        {/* Hours List */}
        <div className="hours-list">
          {daysOfWeek.map((day) => (
            <div key={day} className="hours-row">
              <div className="day-name">
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </div>

              <div className="hours-controls">
                <label className="closed-checkbox">
                  <input
                    type="checkbox"
                    checked={venueData.hours[day].closed}
                    onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                  />
                  <span>Closed</span>
                </label>

                {!venueData.hours[day].closed && (
                  <>
                    <select
                      className="time-select"
                      value={venueData.hours[day].open}
                      onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                    >
                      <option value="">Opens</option>
                      {timeOptions.map(time => (
                        <option key={time.value} value={time.value}>
                          {time.label}
                        </option>
                      ))}
                    </select>

                    <span className="time-separator">—</span>

                    <select
                      className="time-select"
                      value={venueData.hours[day].close}
                      onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                    >
                      <option value="">Closes</option>
                      {timeOptions.map(time => (
                        <option key={time.value} value={time.value}>
                          {time.label}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CreateVenue;