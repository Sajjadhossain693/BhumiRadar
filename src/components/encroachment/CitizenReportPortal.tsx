import React, { useState } from 'react';
import { useI18n } from '../../i18n/provider';
import { I } from '../ui/Icons';
import { useToast } from '../ui/Toaster';
import {
  screenLocationAgainstProtectedLand,
  submitCitizenEncroachmentReport,
  getPublicReportStatus,
  updateReportStatusByOfficer,
  getAllCitizenReports,
  IncidentCategory,
  CitizenEncroachmentReport,
  ReportStatus,
} from '../../services/encroachmentReport';

export const CitizenReportPortal: React.FC = () => {
  const { t, lang } = useI18n();
  const { show } = useToast();

  const [portalMode, setPortalMode] = useState<'submit' | 'track' | 'triage'>('submit');

  // Submit form state
  const [category, setCategory] = useState<IncidentCategory>('khas_encroachment');
  const [description, setDescription] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('ধামরাই, ঢাকা');
  const [incidentDate, setIncidentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [reporterName, setReporterName] = useState<string>('');
  const [reporterPhone, setReporterPhone] = useState<string>('');
  const [reporterNid, setReporterNid] = useState<string>('');
  const [lat, setLat] = useState<number>(23.9215);
  const [lng, setLng] = useState<number>(90.174);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [evidenceFileName, setEvidenceFileName] = useState<string>('incident_boundary_photo.jpg');

  // Tracking query state
  const [trackQuery, setTrackQuery] = useState<string>('');
  const [trackedReport, setTrackedReport] = useState<CitizenEncroachmentReport | null>(null);
  const [trackSearched, setTrackSearched] = useState<boolean>(false);

  // Success modal state
  const [submittedReport, setSubmittedReport] = useState<CitizenEncroachmentReport | null>(null);

  // Triage state & RBAC Officer Gate
  const [reportsList, setReportsList] = useState<CitizenEncroachmentReport[]>(() => getAllCitizenReports());
  const [triageFilter, setTriageFilter] = useState<string>('ALL');
  const [isOfficerAuthenticated, setIsOfficerAuthenticated] = useState<boolean>(false);
  const [officerPinInput, setOfficerPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Real-time screening preview
  const spatialScreening = screenLocationAgainstProtectedLand({ lat, lng });

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      show('warn', lang === 'bn' ? 'ব্রাউজার জিওলোকেশন সমর্থিত নয়, দয়া করে স্থানাঙ্ক লিখুন' : 'Geolocation not supported, please enter coordinates');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(parseFloat(pos.coords.latitude.toFixed(6)));
        setLng(parseFloat(pos.coords.longitude.toFixed(6)));
        setIsLocating(false);
        show('success', lang === 'bn' ? '✓ বর্তমান জিপিএস স্থানাঙ্ক গৃহীত হয়েছে' : '✓ Current GPS coordinates captured');
      },
      err => {
        setIsLocating(false);
        show('warn', lang === 'bn' ? 'জিপিএস অনুমতি পাওয়া যায়নি, ডিফল্ট স্থানাঙ্ক ব্যবহৃত হচ্ছে' : 'GPS permission denied, using default');
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      show('warn', lang === 'bn' ? 'অনুগ্রহ করে ঘটনার বিবরণ লিখুন' : 'Please provide incident description');
      return;
    }

    const report = submitCitizenEncroachmentReport({
      category,
      description,
      locationName,
      incidentDate,
      coords: { lat, lng },
      isAnonymous,
      reporterInfo: isAnonymous ? undefined : { name: reporterName, phone: reporterPhone, nid: reporterNid },
      evidenceFileName,
    });

    setSubmittedReport(report);
    setReportsList(getAllCitizenReports());
    show(
      'success',
      lang === 'bn'
        ? `অভিযোগ সফলভাবে দাখিল হয়েছে! ট্র্যাকিং আইডি: ${report.id}`
        : `Report submitted! Tracking ID: ${report.id}`
    );
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackSearched(true);
    const res = getPublicReportStatus(trackQuery);
    setTrackedReport(res);
  };

  const handleTriageUpdate = (reportId: string, newStatus: ReportStatus) => {
    const updated = updateReportStatusByOfficer({
      reportId,
      status: newStatus,
      officerName: 'AC-LAND-01',
      officerNotes: lang === 'bn' ? 'সহকারী কমিশনার (ভূমি) কর্তৃক যাচাই ও পদক্ষেপ গ্রহণ' : 'Verified and actioned by AC Land',
    });
    if (updated) {
      setReportsList(getAllCitizenReports());
      show('success', lang === 'bn' ? 'অভিযোগের অবস্থা আপডেট ও অডিটে সংরক্ষিত হয়েছে' : 'Status updated and audited');
    }
  };

  const handleOfficerAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (officerPinInput.trim() === '1234') {
      setIsOfficerAuthenticated(true);
      setPinError('');
      show('success', lang === 'bn' ? 'কর্মকর্তা হিসেবে সফলভাবে যাচাইকৃত' : 'Officer authenticated successfully');
    } else {
      setPinError(lang === 'bn' ? 'ভুল নিরাপত্তা পিন! অনুমতি অস্বীকৃত।' : 'Invalid security PIN! Access denied.');
      show('error', lang === 'bn' ? 'ভুল নিরাপত্তা পিন!' : 'Invalid PIN!');
    }
  };

  return (
    <div className="card" style={{ marginTop: 16 }}>
      {/* Sub-header Navigation */}
      <div className="card__title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <I.alert size={20} style={{ color: 'var(--danger-600)' }} />
          <div>
            <h3 style={{ margin: 0 }}>
              {lang === 'bn' ? 'খাসজমি রক্ষা করুন — নাগরিক অভিযোগ ও ট্র্যাকিং' : 'Report Suspected Encroachment ("Protect Khas Land")'}
            </h3>
            <small className="muted">
              {lang === 'bn' ? 'খাসজমি, নদী-খাল ও সরকারি জলাশয় দখল প্রতিরোধে নাগরিক অংশীদারিত্ব' : 'Crowdsourced citizen reporting against public land & wetland grabbing'}
            </small>
          </div>
        </div>

        <div className="row gap-6">
          <button
            className={`btn btn-sm ${portalMode === 'submit' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPortalMode('submit')}
          >
            <I.camera size={14} /> {lang === 'bn' ? 'অভিযোগ দাখিল' : 'Submit Report'}
          </button>
          <button
            className={`btn btn-sm ${portalMode === 'track' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPortalMode('track')}
          >
            <I.search size={14} /> {lang === 'bn' ? 'অভিযোগের অবস্থা জানুন' : 'Track Status'}
          </button>
          <button
            className={`btn btn-sm ${portalMode === 'triage' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPortalMode('triage')}
          >
            <I.shield size={14} /> {lang === 'bn' ? 'কর্মকর্তা ট্রায়াজ ডেস্ক' : 'Officer Triage'}
          </button>
        </div>
      </div>

      {/* MODE 1: Citizen Submission Form */}
      {portalMode === 'submit' && (
        <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
          <div className="grid grid-2" style={{ gap: 16 }}>
            {/* Left column */}
            <div>
              <div className="mb-12">
                <label className="label">{lang === 'bn' ? 'দখল / অনিয়মের ধরন' : 'Violation Category'}</label>
                <select
                  className="select"
                  value={category}
                  onChange={e => setCategory(e.target.value as IncidentCategory)}
                >
                  <option value="khas_encroachment">{lang === 'bn' ? 'সরকারি খাসজমি জবরদখল' : 'Government Khas Land Grabbing'}</option>
                  <option value="canal_river_filling">{lang === 'bn' ? 'নদী / খাল ভরাট ও গতিপথ পরিবর্তন' : 'River / Canal Landfilling'}</option>
                  <option value="wetland_destruction">{lang === 'bn' ? 'জলাশয় / বিল / ডোবা ভরাট' : 'Wetland Destruction'}</option>
                  <option value="forest_land_grabbing">{lang === 'bn' ? 'বনভূমি ও সংরক্ষিত বনাঞ্চল দখল' : 'Forest Land Encroachment'}</option>
                  <option value="unauthorized_wall">{lang === 'bn' ? 'সরকারি জমিতে অননুমোদিত দেয়াল / স্থাপনা' : 'Unauthorized Boundary Wall'}</option>
                  <option value="hill_cutting">{lang === 'bn' ? 'পাহাড় বা টিলা কর্তন' : 'Illegal Hill Cutting'}</option>
                </select>
              </div>

              <div className="mb-12">
                <label className="label">{lang === 'bn' ? 'স্থানের বিবরণ ও এলাকা' : 'Location / Landmark'}</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: ধামরাই বাজার সংলগ্ন বংশী নদীর তীরবর্তী খাস জমি' : 'e.g. Bangshi riverbank khas land, Dhamrai'}
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                />
              </div>

              <div className="row gap-12 mb-12">
                <div style={{ flex: 1 }}>
                  <label className="label">{lang === 'bn' ? 'অক্ষাংশ (Latitude)' : 'Latitude'}</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="input font-mono"
                    value={lat}
                    onChange={e => setLat(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">{lang === 'bn' ? 'দ্রাঘিমাংশ (Longitude)' : 'Longitude'}</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="input font-mono"
                    value={lng}
                    onChange={e => setLng(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={isLocating}
                    onClick={handleGetCurrentLocation}
                    title={lang === 'bn' ? 'ডিভাইসের জিপিএস অবস্থান নিন' : 'Capture GPS Location'}
                  >
                    <I.pin size={16} /> {isLocating ? '...' : (lang === 'bn' ? 'জিপিএস নিন' : 'GPS')}
                  </button>
                </div>
              </div>

              <div className="mb-12">
                <label className="label">{lang === 'bn' ? 'ঘটনা সনাক্তের তারিখ' : 'Incident Date'}</label>
                <input
                  type="date"
                  className="input"
                  required
                  value={incidentDate}
                  onChange={e => setIncidentDate(e.target.value)}
                />
              </div>

              <div className="mb-12">
                <label className="label">{lang === 'bn' ? 'চিত্র বা প্রামাণ্য ছবি' : 'Photo / Evidence File'}</label>
                <div style={{ border: '2px dashed var(--border-color)', padding: 14, borderRadius: 8, textAlign: 'center', background: 'var(--ink-50)' }}>
                  <I.camera size={28} style={{ color: 'var(--ink-400)', margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{evidenceFileName}</div>
                  <small className="muted">{lang === 'bn' ? 'স্মার্টফোন বা ক্যামেরার ছবি নির্বাচন করুন (সর্বোচ্চ ১০ এমবি)' : 'Smartphone photo or survey capture'}</small>
                </div>
              </div>
            </div>

            {/* Right column: GIS Screening Preview & Privacy Settings */}
            <div>
              {/* Real-time GIS spatial match badge */}
              <div
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 14,
                  background: spatialScreening.outcome === 'potential_geographic_match' ? '#ecfdf5' : '#f8fafc',
                }}
              >
                <div className="row justify-between mb-4">
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {lang === 'bn' ? 'স্বয়ংক্রিয় জিআইএস স্থানিক যাচাই (Spatial Screening):' : 'Automated Spatial Screening:'}
                  </span>
                  {spatialScreening.outcome === 'potential_geographic_match' ? (
                    <span className="badge badge-success">{lang === 'bn' ? '✓ খাসজমি সীমানা সনাক্ত' : '✓ Khas Boundary Match'}</span>
                  ) : (
                    <span className="badge badge-outline">{lang === 'bn' ? 'সীমানা যাচাইাধীন' : 'Verification Pending'}</span>
                  )}
                </div>

                <div style={{ fontSize: '0.84rem', color: 'var(--ink-700)', lineHeight: 1.4 }}>
                  {spatialScreening.outcome === 'potential_geographic_match'
                    ? (lang === 'bn'
                        ? `প্রদত্ত স্থানাঙ্কটি সরকারি খাসজমি প্লট (${spatialScreening.matchedPlot?.mouzaBn}, দাগ #${spatialScreening.matchedPlot?.dag}) এর নিবন্ধিত সীমানার সাথে মিলেছে। এটি উচ্চ অগ্রাধিকারযোগ্য অভিযোগ হিসেবে গণ্য হবে।`
                        : `Coordinates intersect registered Khas plot boundaries on Dag #${spatialScreening.matchedPlot?.dag}.`)
                    : (lang === 'bn'
                        ? 'প্রদত্ত স্থানাঙ্কের সন্নিকটে সরকারি রেকর্ডের সাথে স্থানিক ম্যাচ যাচাইয়ের জন্য সহকারী কমিশনার (ভূমি) এর মাঠপর্যায়ে তদন্তে পাঠানো হবে।'
                        : 'No direct polygon intersection in local demo boundary; will be routed for manual field surveyor verification.')}
                </div>
              </div>

              {/* Privacy and Anonymity Toggle */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                <div className="row justify-between" style={{ alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={e => setIsAnonymous(e.target.checked)}
                    />
                    <strong style={{ fontSize: '0.9rem', color: 'var(--ink-900)' }}>
                      {lang === 'bn' ? 'আমার পরিচয় সম্পূর্ণ গোপন রাখুন (Anonymous Reporting)' : 'Keep My Identity Confidential'}
                    </strong>
                  </label>
                  <span className="badge badge-purple">{lang === 'bn' ? 'সুরক্ষিত' : 'Encrypted'}</span>
                </div>

                <div className="muted text-xs mb-8" style={{ lineHeight: 1.4 }}>
                  {lang === 'bn'
                    ? 'বেনামী রিপোর্ট নির্বাচন করলে সিস্টেমে আপনার নাম, ফোন নম্বর কিংবা কোনো ব্যক্তিগত তথ্য সংরক্ষিত হবে না। আপনি শুধু ট্র্যাকিং নম্বর দিয়ে স্ট্যাটাস দেখতে পারবেন।'
                    : 'Anonymous mode strictly redacts reporter PII. Only public tracking number is issued.'}
                </div>

                {!isAnonymous && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border-color)' }}>
                    <div>
                      <label className="label">{lang === 'bn' ? 'আপনার নাম' : 'Reporter Name'}</label>
                      <input
                        type="text"
                        className="input"
                        value={reporterName}
                        onChange={e => setReporterName(e.target.value)}
                      />
                    </div>
                    <div className="row gap-8">
                      <div style={{ flex: 1 }}>
                        <label className="label">{lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}</label>
                        <input
                          type="text"
                          className="input"
                          value={reporterPhone}
                          onChange={e => setReporterPhone(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="label">{lang === 'bn' ? 'এনআইডি (ঐচ্ছিক)' : 'NID (Optional)'}</label>
                        <input
                          type="text"
                          className="input"
                          value={reporterNid}
                          onChange={e => setReporterNid(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-12">
                <label className="label">{lang === 'bn' ? 'ঘটনার বিস্তারিত বিবরণ' : 'Detailed Description'}</label>
                <textarea
                  className="input"
                  rows={4}
                  required
                  placeholder={lang === 'bn' ? 'বেদখলের প্রকৃতি, জড়িত ব্যক্তিবর্গ বা চলমান কাজের বিবরণ লিখুন...' : 'Describe how the encroachment is occurring...'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="submit" className="btn btn-primary">
                  <I.send size={16} /> {lang === 'bn' ? 'অভিযোগ দাখিল করুন' : 'Submit Encroachment Report'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* MODE 2: Public Tracking Lookup */}
      {portalMode === 'track' && (
        <div style={{ marginTop: 16 }}>
          <form onSubmit={handleTrack} className="row gap-8 mb-16" style={{ maxWidth: 540 }}>
            <input
              type="text"
              className="input font-mono"
              placeholder={lang === 'bn' ? 'ট্র্যাকিং নম্বর লিখুন (যেমন: KHA-2026-001)' : 'Enter tracking code (e.g. KHA-2026-001)'}
              value={trackQuery}
              onChange={e => setTrackQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              <I.search size={14} /> {lang === 'bn' ? 'অনুসন্ধান' : 'Track'}
            </button>
          </form>

          {trackSearched && !trackedReport && (
            <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8, color: '#991b1b', fontSize: '0.88rem' }}>
              ⚠️ {lang === 'bn' ? 'এই ট্র্যাকিং নম্বরে কোনো রিপোর্ট খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক আইডি লিখুন।' : 'No report found with this tracking ID.'}
            </div>
          )}

          {trackedReport && (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, background: 'var(--surface)' }}>
              <div className="row justify-between mb-8" style={{ alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>{trackedReport.id}</strong>
                  <span className="badge badge-info" style={{ marginLeft: 8 }}>
                    {trackedReport.category}
                  </span>
                </div>
                <span className="badge badge-success">
                  {trackedReport.status}
                </span>
              </div>

              <div className="row gap-16 mb-12 text-sm">
                <div><strong>{lang === 'bn' ? 'স্থান:' : 'Location:'}</strong> {trackedReport.locationName}</div>
                <div><strong>{lang === 'bn' ? 'ঘটনার তারিখ:' : 'Date:'}</strong> {trackedReport.incidentDate}</div>
                <div><strong>{lang === 'bn' ? 'রিপোর্টারের গোপনীয়তা:' : 'Privacy:'}</strong> {trackedReport.isAnonymous ? '✓ পরিচয় সম্পূর্ণ সংরক্ষিত' : 'Verified Citizen'}</div>
              </div>

              <div style={{ background: 'var(--ink-50)', padding: 12, borderRadius: 6, fontSize: '0.86rem', marginBottom: 12 }}>
                <strong>{lang === 'bn' ? 'বিবরণ:' : 'Description:'}</strong> {trackedReport.description}
              </div>

              {trackedReport.matchedPlotDetails && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 6, fontSize: '0.84rem', color: '#166534', marginBottom: 12 }}>
                  ✓ <strong>{lang === 'bn' ? 'সরকারি খাসজমি সীমানা রেকর্ড:' : 'Matched Khas Boundary:'}</strong>{' '}
                  মৌজা: {trackedReport.matchedPlotDetails.mouza}, দাগ নং: {trackedReport.matchedPlotDetails.dag} ({trackedReport.matchedPlotDetails.ownershipType})
                </div>
              )}

              {trackedReport.officerNotes && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: 12, borderRadius: 6, fontSize: '0.84rem', color: '#1e40af' }}>
                  👮 <strong>{lang === 'bn' ? 'তদন্তকারী কর্মকর্তার গৃহীত পদক্ষেপ:' : 'Officer Action & Notes:'}</strong>{' '}
                  {trackedReport.officerNotes}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 3: Officer Triage & Review with RBAC Authorization Gate */}
      {portalMode === 'triage' && !isOfficerAuthenticated && (
        <div style={{ marginTop: 24, padding: 24, border: '1px solid var(--border-color)', borderRadius: 10, background: 'var(--ink-50)', textAlign: 'center', maxWidth: 440, margin: '24px auto' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <I.shield size={24} style={{ color: 'var(--danger-600)' }} />
          </div>
          <h4 style={{ margin: '0 0 6px 0' }}>
            {lang === 'bn' ? 'কর্মকর্তা নিরাপত্তা যাচাইকরণ' : 'Officer Security Verification'}
          </h4>
          <p className="muted text-sm" style={{ margin: '0 0 16px 0' }}>
            {lang === 'bn' ? 'নাগরিক অভিযোগ ট্রায়াজ ও তদন্ত আদেশ কেবল অনুমোদিত রাজস্ব কর্মকর্তার জন্য সংরক্ষিত।' : 'Citizen complaint triage is restricted to authorized Revenue Officers.'}
          </p>

          <form onSubmit={handleOfficerAuth}>
            <div className="mb-12">
              <input
                type="password"
                className="input text-center font-mono"
                placeholder={lang === 'bn' ? 'অফিসার পিন কোড লিখুন (ডেমো: 1234)' : 'Enter Officer PIN (Demo: 1234)'}
                value={officerPinInput}
                onChange={e => setOfficerPinInput(e.target.value)}
                maxLength={8}
                autoFocus
              />
              {pinError && <div style={{ color: 'var(--danger-600)', fontSize: '0.8rem', marginTop: 4 }}>{pinError}</div>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <I.lock size={16} /> {lang === 'bn' ? 'প্রবেশ অনুমোদন করুন' : 'Authenticate Access'}
            </button>
          </form>
        </div>
      )}

      {/* MODE 3: Authenticated Officer Triage View */}
      {portalMode === 'triage' && isOfficerAuthenticated && (
        <div style={{ marginTop: 16 }}>
          <div className="row justify-between mb-12" style={{ alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                <I.shield size={12} /> {lang === 'bn' ? 'যাচাইকৃত কর্মকর্তা: এসি ল্যান্ড' : 'Verified: AC Land'}
              </span>
              <span className="muted text-sm">
                {lang === 'bn' ? 'নাগরিকদের দাখিলকৃত রিপোর্ট পর্যালোচনা ও মাঠপর্যায়ে তদন্ত আদেশ' : 'Citizen report triage and officer action desk'}
              </span>
            </div>
            <div className="row gap-8" style={{ alignItems: 'center' }}>
              <span className="badge badge-outline">{reportsList.length} {lang === 'bn' ? 'টি রিপোর্ট' : 'reports'}</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setIsOfficerAuthenticated(false);
                  setOfficerPinInput('');
                  show('info', lang === 'bn' ? 'লগআউট সম্পন্ন' : 'Logged out');
                }}
              >
                <I.lock size={14} /> {lang === 'bn' ? 'লক করুন' : 'Lock Desk'}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ fontSize: '0.86rem' }}>
              <thead>
                <tr>
                  <th>{lang === 'bn' ? 'ট্র্যাকিং আইডি' : 'Tracking ID'}</th>
                  <th>{lang === 'bn' ? 'স্থান ও ধরন' : 'Location & Category'}</th>
                  <th>{lang === 'bn' ? 'জিআইএস ম্যাচ' : 'GIS Match'}</th>
                  <th>{lang === 'bn' ? 'রিপোর্টার' : 'Reporter'}</th>
                  <th>{lang === 'bn' ? 'বর্তমান অবস্থা' : 'Status'}</th>
                  <th style={{ textAlign: 'right' }}>{lang === 'bn' ? 'পদক্ষেপ' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {reportsList.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono"><strong>{r.id}</strong></td>
                    <td>
                      <div><strong>{r.locationName}</strong></div>
                      <div className="muted text-xs">{r.category}</div>
                    </td>
                    <td>
                      {r.screeningOutcome === 'potential_geographic_match' ? (
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                          ✓ খাসজমি সীমানা
                        </span>
                      ) : (
                        <span className="badge badge-outline" style={{ fontSize: '0.72rem' }}>
                          মাঠপর্যায়ে যাচাই
                        </span>
                      )}
                    </td>
                    <td>
                      {r.isAnonymous ? (
                        <span className="muted text-xs">🔒 বেনামী নাগরিক</span>
                      ) : (
                        <span className="text-xs">{r.reporterInfo?.name || 'নাগরিক'}</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">{r.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row gap-4 justify-end">
                        {r.status !== 'field_verification' && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleTriageUpdate(r.id, 'field_verification')}
                          >
                            তদন্ত আদেশ
                          </button>
                        )}
                        {r.status !== 'resolved' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleTriageUpdate(r.id, 'resolved')}
                          >
                            উচ্ছেদ সম্পন্ন
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission Success Dialog */}
      {submittedReport && (
        <div className="modal-overlay" onClick={() => setSubmittedReport(null)}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <I.checkCircle size={26} style={{ color: 'var(--success-600)' }} />
                <div>
                  <h3 style={{ margin: 0 }}>
                    {lang === 'bn' ? 'নাগরিক অভিযোগ সফলভাবে গৃহীত হয়েছে' : 'Encroachment Alert Received'}
                  </h3>
                  <small className="muted">{submittedReport.id}</small>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSubmittedReport(null)}><I.close size={18} /></button>
            </div>

            <div className="modal-body" style={{ fontSize: '0.88rem' }}>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 12, borderRadius: 6, marginBottom: 12, color: '#065f46' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                  {lang === 'bn' ? 'আপনার ট্র্যাকিং কোড:' : 'Your Tracking Code:'} <span className="font-mono">{submittedReport.id}</span>
                </div>
                <div>
                  {lang === 'bn'
                    ? 'খাসজমি ও সরকারি সম্পদ রক্ষায় এগিয়ে আসার জন্য আপনাকে আন্তরিক ধন্যবাদ। সহকারী কমিশনার (ভূমি) এর কার্যালয়ে তদন্ত প্রক্রিয়া শুরু হয়েছে এবং সিদ্ধান্তটি ক্রিপ্টোগ্রাফিক অডিট লেজারে নথিভুক্ত হয়েছে।'
                    : 'Thank you for protecting public wetlands and government khas land. The incident has been recorded in the civil action ledger.'}
                </div>
              </div>

              <div className="row justify-between text-xs muted">
                <span>{lang === 'bn' ? 'গোপনীয়তা সুরক্ষা:' : 'Confidentiality:'} {submittedReport.isAnonymous ? '১০০% বেনামী' : 'সংরক্ষিত'}</span>
                <span>{new Date(submittedReport.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => { setPortalMode('track'); setTrackQuery(submittedReport.id); setSubmittedReport(null); }}>
                {lang === 'bn' ? 'স্ট্যাটাস ট্র্যাকিং দেখুন' : 'Track This Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
