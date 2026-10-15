import { useState, useEffect, useRef } from 'react';
import ImageUpload from '../ui/ImageUpload';
import Button from '../ui/Button';
import EventImage from '../ui/EventImage';

const CATEGORIES = [
  { value: '', label: 'Select a category' },
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'concert', label: 'Concert' },
  { value: 'sports', label: 'Sports' },
  { value: 'networking', label: 'Networking' },
  { value: 'webinar', label: 'Webinar' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'TRY', label: 'TRY (₺)' },
  { value: 'GBP', label: 'GBP (£)' },
];

const INITIAL_FORM = {
  title: '',
  description: '',
  category: '',
  date: '',
  endDate: '',
  time: '',
  venue: '',
  address: '',
  city: '',
  country: '',
  capacity: '',
  price: 0,
  currency: 'USD',
  tags: [],
  image: '',
};

const STEPS = [
  { id: 1, title: 'Essentials', desc: 'Title, category & overview' },
  { id: 2, title: 'Schedule & Venue', desc: 'Dates, time & location' },
  { id: 3, title: 'Capacity & Pricing', desc: 'Tickets & headcount' },
  { id: 4, title: 'Media & Branding', desc: 'Cover image & tags' },
  { id: 5, title: 'Review & Launch', desc: 'Verification & publish' },
];

const EventForm = ({ initialData = null, onSubmit, isEditing = false, isLoading = false }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [tagInput, setTagInput] = useState('');
  const firstErrorRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || '',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        time: initialData.time || '',
        venue: initialData.location?.venue || initialData.venue || '',
        address: initialData.location?.address || initialData.address || '',
        city: initialData.location?.city || initialData.city || '',
        country: initialData.location?.country || initialData.country || '',
        capacity: initialData.capacity || '',
        price: initialData.price ?? 0,
        currency: initialData.currency || 'USD',
        tags: initialData.tags || [],
        image: initialData.image || '',
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (firstErrorRef.current) {
      firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstErrorRef.current = null;
    }
  }, [errors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : Number(value);
    if ((name === 'price' || name === 'capacity') && numValue !== '' && numValue < 0) return;
    setFormData((prev) => ({ ...prev, [name]: numValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.title.trim() || formData.title.trim().length < 3) {
        newErrors.title = 'Title must be at least 3 characters';
      } else if (formData.title.trim().length > 100) {
        newErrors.title = 'Title must be at most 100 characters';
      }

      if (!formData.description.trim() || formData.description.trim().length < 10) {
        newErrors.description = 'Description must be at least 10 characters';
      } else if (formData.description.trim().length > 5000) {
        newErrors.description = 'Description must be at most 5000 characters';
      }

      if (!formData.category) {
        newErrors.category = 'Please select a category';
      }
    }

    if (step === 2) {
      if (!formData.date) {
        newErrors.date = 'Event date is required';
      } else if (!isEditing && new Date(formData.date) < new Date(new Date().toDateString())) {
        newErrors.date = 'Event date must be in the future';
      }

      if (formData.endDate && formData.date && new Date(formData.endDate) < new Date(formData.date)) {
        newErrors.endDate = 'End date must be after start date';
      }

      if (!formData.venue.trim()) {
        newErrors.venue = 'Venue name is required';
      }

      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      }
    }

    if (step === 3) {
      if (!formData.capacity || Number(formData.capacity) < 1) {
        newErrors.capacity = 'Capacity must be at least 1';
      }

      if (formData.price < 0) {
        newErrors.price = 'Price cannot be negative';
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateAll = () => {
    const s1 = validateStep(1);
    const s2 = validateStep(2);
    const s3 = validateStep(3);
    return s1 && s2 && s3;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPayload = () => ({
    title: formData.title.trim(),
    description: formData.description.trim(),
    category: formData.category,
    date: formData.date,
    endDate: formData.endDate || undefined,
    time: formData.time || undefined,
    location: {
      venue: formData.venue.trim(),
      address: formData.address.trim() || undefined,
      city: formData.city.trim(),
      country: formData.country.trim() || undefined,
    },
    capacity: Number(formData.capacity),
    price: Number(formData.price) || 0,
    currency: Number(formData.price) > 0 ? formData.currency : undefined,
    tags: formData.tags.length > 0 ? formData.tags : undefined,
    image: formData.image || undefined,
  });

  const handleSubmit = (e, action = 'draft') => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateAll()) {
      // Find lowest failing step
      if (!validateStep(1)) setCurrentStep(1);
      else if (!validateStep(2)) setCurrentStep(2);
      else if (!validateStep(3)) setCurrentStep(3);
      return;
    }
    onSubmit(buildPayload(), action);
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 bg-white dark:bg-slate-900
     text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm
     focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
     ${errors[field]
      ? 'border-danger-400 dark:border-danger-500 ring-1 ring-danger-400'
      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
    }`;

  const labelClass = 'block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5';
  const errorClass = 'mt-1.5 text-xs font-medium text-danger-500 dark:text-danger-400 flex items-center gap-1';

  return (
    <div className="space-y-8">
      {/* 5-Step Guided Progress Wizard Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  // Allow jumping to any previous step or next if valid
                  if (step.id < currentStep || isEditing || validateStep(currentStep)) {
                    setCurrentStep(step.id);
                  }
                }}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950/60 ring-2 ring-primary-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/25 ring-4 ring-primary-100 dark:ring-primary-950'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    `0${step.id}`
                  )}
                </div>
                <span className={`text-xs font-semibold hidden md:block ${isActive ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} noValidate>
        {/* Step 1: Essentials */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Step 1 of 5</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Basic Information</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Give your campus event an engaging title and clear description for attendees.
              </p>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="title" className={labelClass}>Event Title <span className="text-danger-500">*</span></label>
                <span className="text-xs text-slate-400 dark:text-slate-500">{formData.title.length}/100</span>
              </div>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Campus Hackathon 2026 or Spring Tech Symposium"
                maxLength={100}
                className={inputClass('title')}
              />
              {errors.title && <p className={errorClass}>{errors.title}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className={labelClass}>Category <span className="text-danger-500">*</span></label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={inputClass('category')}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className={errorClass}>{errors.category}</p>}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="description" className={labelClass}>Description <span className="text-danger-500">*</span></label>
                <span className="text-xs text-slate-400 dark:text-slate-500">{formData.description.length}/5000</span>
              </div>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Explain what attendees will learn, key speakers, schedule, and prerequisites..."
                rows={6}
                maxLength={5000}
                className={`${inputClass('description')} resize-y min-h-[140px]`}
              />
              {errors.description && <p className={errorClass}>{errors.description}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Schedule & Venue */}
        {currentStep === 2 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Step 2 of 5</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Schedule & Location</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Define when and where your campus event takes place so attendees show up at the right spot.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Date */}
              <div>
                <label htmlFor="date" className={labelClass}>Start Date <span className="text-danger-500">*</span></label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={inputClass('date')}
                />
                {errors.date && <p className={errorClass}>{errors.date}</p>}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className={labelClass}>End Date (Optional)</label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.date || undefined}
                  className={inputClass('endDate')}
                />
                {errors.endDate && <p className={errorClass}>{errors.endDate}</p>}
              </div>

              {/* Time */}
              <div className="sm:col-span-2">
                <label htmlFor="time" className={labelClass}>Time / Duration Details</label>
                <input
                  id="time"
                  name="time"
                  type="text"
                  value={formData.time}
                  onChange={handleChange}
                  placeholder="e.g. 10:00 AM – 3:00 PM EST"
                  className={inputClass('time')}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Venue & Map Address</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Venue */}
                <div className="sm:col-span-2">
                  <label htmlFor="venue" className={labelClass}>Venue / Hall Name <span className="text-danger-500">*</span></label>
                  <input
                    id="venue"
                    name="venue"
                    type="text"
                    value={formData.venue}
                    onChange={handleChange}
                    placeholder="e.g. Main Auditorium, Science Block Hall B"
                    className={inputClass('venue')}
                  />
                  {errors.venue && <p className={errorClass}>{errors.venue}</p>}
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelClass}>Street Address</label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 100 Innovation Way"
                    className={inputClass('address')}
                  />
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className={labelClass}>City / Campus <span className="text-danger-500">*</span></label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Boston or North Campus"
                    className={inputClass('city')}
                  />
                  {errors.city && <p className={errorClass}>{errors.city}</p>}
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="country" className={labelClass}>Country / State</label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g. USA"
                    className={inputClass('country')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Capacity & Pricing */}
        {currentStep === 3 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Step 3 of 5</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Capacity & Ticketing</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Set participant limits and ticketing fees. Zero dollars automatically designates a Free event.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Capacity */}
              <div>
                <label htmlFor="capacity" className={labelClass}>Max Capacity (Headcount) <span className="text-danger-500">*</span></label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={handleNumberChange}
                  placeholder="e.g. 150"
                  className={inputClass('capacity')}
                />
                {errors.capacity && <p className={errorClass}>{errors.capacity}</p>}
                <p className="mt-1 text-xs text-slate-400">Registrations will automatically close once this limit is reached.</p>
              </div>

              {/* Pricing */}
              <div>
                <label htmlFor="price" className={labelClass}>Ticket Price</label>
                <div className="flex gap-2">
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleNumberChange}
                    placeholder="0 for Free"
                    className={inputClass('price')}
                  />
                  {Number(formData.price) > 0 && (
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr.value} value={curr.value}>{curr.label}</option>
                      ))}
                    </select>
                  )}
                </div>
                {errors.price && <p className={errorClass}>{errors.price}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  {Number(formData.price) === 0 ? '✓ Free admission — frictionless 1-click registration enabled.' : 'Paid event ticket.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Media & Branding */}
        {currentStep === 4 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Step 4 of 5</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Branding & Media</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Upload a 16:9 banner and add discovery tags to attract campus attendees.
              </p>
            </div>

            {/* Event Image */}
            <div>
              <label className={labelClass}>Event Banner (Standard 16:9 Aspect Ratio)</label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => {
                  setFormData((prev) => ({ ...prev, image: url }));
                }}
              />
            </div>

            {/* Tags */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label htmlFor="tagInput" className={labelClass}>Topic Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                               bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-primary-400 hover:text-danger-500 ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <input
                id="tagInput"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type tag and press Enter (e.g. coding, hackathon, ai)"
                className={inputClass('tags')}
                disabled={formData.tags.length >= 10}
              />
              <p className="mt-1 text-xs text-slate-400">
                {formData.tags.length}/10 tags added
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Review & Launch */}
        {currentStep === 5 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-8">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Step 5 of 5</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Review & Launch</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Review your event details before publishing or submitting for administrator review.
              </p>
            </div>

            {/* Live Preview Card */}
            <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-2">Live Marketplace Card Preview</span>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                <EventImage src={formData.image} alt={formData.title} category={formData.category} />
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300">
                      {formData.category || 'Event'}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 ml-auto">
                      {Number(formData.price) > 0 ? `${formData.currency} ${formData.price}` : 'Free Admission'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{formData.title || 'Untitled Event'}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{formData.description || 'No description provided.'}</p>
                  <div className="pt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <span>📅 {formData.date || 'TBD'}</span>
                    <span>📍 {formData.venue || 'TBD'}</span>
                    <span>👥 {formData.capacity || 0} seats</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Specs Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{formData.category || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.date || 'Not set'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.venue ? `${formData.venue}, ${formData.city}` : 'Not set'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Capacity</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.capacity || 0} attendees</span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="secondary"
                onClick={prevStep}
                disabled={isLoading}
              >
                ← Back
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {currentStep < 5 ? (
              <Button
                type="button"
                variant="primary"
                onClick={nextStep}
              >
                Continue to Next Step →
              </Button>
            ) : (
              <>
                {!isEditing && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={(e) => handleSubmit(e, 'draft')}
                      disabled={isLoading}
                    >
                      Save as Draft
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={(e) => handleSubmit(e, 'review')}
                      isLoading={isLoading}
                    >
                      Submit for Review
                    </Button>
                    <Button
                      type="button"
                      variant="accent"
                      onClick={(e) => handleSubmit(e, 'publish')}
                      isLoading={isLoading}
                    >
                      Publish Immediately
                    </Button>
                  </>
                )}

                {isEditing && (
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                  >
                    Update Event
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
