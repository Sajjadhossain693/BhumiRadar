import React, { useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { useToast } from '../components/ui/Toaster';
import {
  getPoaRegistry,
  verifyPoaForTransaction,
  executePoaRevocation,
  triggerSimulatedDeathNotice,
  PowerOfAttorneyRecord,
  PoaScopeAction,
  PoaVerificationResult,
} from '../services/poa';

export const PoASentinel: React.FC = () => {
  const { t, lang } = useI18n();
  const { show } = useToast();

  const [registry, setRegistry] = useState<PowerOfAttorneyRecord[]>(() => getPoaRegistry());
  const [selectedPoaForRevoke, setSelectedPoaForRevoke] = useState<PowerOfAttorneyRecord | null>(null);
  const [revocationReason, setRevocationReason] = useState<string>('বিশ্বাসভঙ্গ ও অসদাচরণের কারণে ক্ষমতা প্রত্যাহার');
  const [revocationDeedNo, setRevocationDeedNo] = useState<string>('REV-DHK-2026-088');
  const [enteredOtp, setEnteredOtp] = useState<string>('123456');

  // Transaction verification widget state
  const [checkPoaId, setCheckPoaId] = useState<string>(registry[0]?.id || 'POA-2024-DHK-0914');
  const [checkPlotId, setCheckPlotId] = useState<string>('PLT-DHK-001');
  const [checkAction, setCheckAction] = useState<PoaScopeAction>('sale');
  const [verificationResult, setVerificationResult] = useState<PoaVerificationResult | null>(null);

  const handleVerify = () => {
    const res = verifyPoaForTransaction({
      poaId: checkPoaId,
      targetPlotId: checkPlotId,
      targetAction: checkAction,
    });
    setVerificationResult(res);
    if (res.isValid) {
      show('success', lang === 'bn' ? '✓ আমমোক্তারনামা সম্পূর্ণ বৈধ ও অনুমোদিত' : '✓ Power of Attorney Verified Valid');
    } else {
      show('error', lang === 'bn' ? `⚠️ লেনদেন ব্লক: ${res.messageBn}` : `⚠️ Transaction Blocked: ${res.messageEn}`);
    }
  };

  const handleRevokeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoaForRevoke) return;

    const res = executePoaRevocation({
      poaId: selectedPoaForRevoke.id,
      revocationDeedNo,
      reasonBn: revocationReason,
      reasonEn: 'Power of attorney formally revoked',
      actorId: 'OFFICER-SUBREG-01',
      simulatedOtp: enteredOtp,
    });

    if (res.success) {
      setRegistry(getPoaRegistry());
      setSelectedPoaForRevoke(null);
      show(
        'success',
        lang === 'bn'
          ? `আমমোক্তারনামা #${res.record?.deedNo} আইন অনুযায়ী বাতিল করা হয়েছে ও অডিট লেজারে সংরক্ষিত হয়েছে!`
          : `PoA #${res.record?.deedNo} revoked and registered in audit ledger!`
      );
    } else {
      show('error', lang === 'bn' ? `বাতিলকরণ ব্যর্থ: ${res.message}` : `Revocation failed: ${res.message}`);
    }
  };

  const handleSimulateDeath = (poa: PowerOfAttorneyRecord) => {
    const res = triggerSimulatedDeathNotice(poa.id);
    if (res) {
      setRegistry(getPoaRegistry());
      show(
        'warn',
        lang === 'bn'
          ? `সতর্কতা: মূল মালিকের মৃত্যুর সংবাদে আমমোক্তারনামা #${poa.deedNo} তাৎক্ষণিক স্থগিত করা হয়েছে!`
          : `Alert: PoA #${poa.deedNo} immediately suspended due to principal death notification!`
      );
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div>
          <div className="crumb"><I.lock size={14} /> {lang === 'bn' ? 'আইনি সম্মতি ও ক্ষমতা যাচাই' : 'Legal Compliance & Authority'}</div>
          <h1>{lang === 'bn' ? 'পাওয়ার অব অ্যাটর্নি সেন্টিনেল (The Power of Attorney Act 2012)' : 'Power of Attorney Revocation Sentinel'}</h1>
          <p className="muted" style={{ marginTop: -4 }}>
            {lang === 'bn'
              ? 'আমমোক্তারনামা আইন ২০১২ ও বিধিমালা ২০১৫ অনুযায়ী ডিজিটাল রেজিস্ট্রি, লেনদেন বৈধতা গেট এবং বাতিলকরণ সুরক্ষা'
              : 'Digital PoA registry, transaction validity gating and instant OTP-protected revocation under the 2012 Act'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4 mb-16">
        <div className="kpi k-info">
          <div className="kpi__label">{lang === 'bn' ? 'মোট নিবন্ধিত আমমোক্তারনামা' : 'Total Registered PoAs'}</div>
          <div className="kpi__value">{registry.length}</div>
          <small className="muted">{lang === 'bn' ? 'সাব-রেজিস্ট্রি কেন্দ্রীয় রেকর্ড' : 'Central Sub-Registry Data'}</small>
        </div>

        <div className="kpi k-success">
          <div className="kpi__label">{lang === 'bn' ? 'সক্রিয় ও বৈধ দলিল' : 'Active Valid Powers'}</div>
          <div className="kpi__value" style={{ color: 'var(--success-700)' }}>
            {registry.filter(p => p.status === 'active').length}
          </div>
          <small className="muted">{lang === 'bn' ? 'লেনদেনের জন্য প্রযোজ্য' : 'Eligible for Transaction'}</small>
        </div>

        <div className="kpi k-danger">
          <div className="kpi__label">{lang === 'bn' ? 'বাতিলকৃত আমমোক্তারনামা' : 'Revoked Powers'}</div>
          <div className="kpi__value" style={{ color: 'var(--danger-700)' }}>
            {registry.filter(p => p.status === 'revoked').length}
          </div>
          <small className="muted">{lang === 'bn' ? 'আইনত সম্পূর্ণ অবৈধ' : 'Legally Voided'}</small>
        </div>

        <div className="kpi k-warn">
          <div className="kpi__label">{lang === 'bn' ? 'মৃত্যুজনিত স্থগিত' : 'Suspended (Death Notice)'}</div>
          <div className="kpi__value" style={{ color: 'var(--warn-700)' }}>
            {registry.filter(p => p.status === 'suspended').length}
          </div>
          <small className="muted">{lang === 'bn' ? 'ধারা ১২ অনুযায়ী স্বয়ংক্রিয় বাতিল' : 'Section 12 Invalidation'}</small>
        </div>
      </div>

      {/* Transaction Gating & Pre-Registration Validation Widget */}
      <div className="card mb-16" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
        <div className="card__title">
          <h3><I.shield size={16} /> {lang === 'bn' ? 'সাব-রেজিস্ট্রি লেনদেন গেটিং উইজেট (Pre-Registration Security Gate)' : 'Pre-Registration PoA Validity Gate'}</h3>
          <span className="badge badge-purple">{lang === 'bn' ? 'স্বয়ংক্রিয় গেট' : 'Automated Gate'}</span>
        </div>
        <p className="muted text-sm" style={{ marginTop: -4 }}>
          {lang === 'bn'
            ? 'জমির দলিল রেজিস্ট্রেশন বা মিউটেশনের পূর্বে আমমোক্তারনামা সক্রিয় কি না, জমিটি অনুমোদিত কি না এবং ক্ষমতা বহির্ভূত কোনো পদক্ষেপ নেওয়া হচ্ছে কি না তা তাৎক্ষণিক পরীক্ষা করুন:'
            : 'Validate whether an attorney possesses active legal authority for a specific plot and transaction head prior to deed execution:'}
        </p>

        <div className="row gap-12" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 1.2 }}>
            <label className="label">{lang === 'bn' ? 'আমমোক্তারনামা দলিল নির্বাচন' : 'Target PoA Document'}</label>
            <select
              className="select"
              value={checkPoaId}
              onChange={e => setCheckPoaId(e.target.value)}
            >
              {registry.map(p => (
                <option key={p.id} value={p.id}>
                  {p.deedNo} ({p.subRegistryOfficeBn}) — {p.principalNameBn} কর্তৃক {p.attorneyNameBn} কে প্রদত্ত [{p.status}]
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: 140 }}>
            <label className="label">{lang === 'bn' ? 'প্লট / দাগ আইডি' : 'Plot ID'}</label>
            <input
              type="text"
              className="input"
              value={checkPlotId}
              onChange={e => setCheckPlotId(e.target.value)}
            />
          </div>

          <div style={{ width: 170 }}>
            <label className="label">{lang === 'bn' ? 'প্রস্তাবিত পদক্ষেপ' : 'Attempted Action'}</label>
            <select
              className="select"
              value={checkAction}
              onChange={e => setCheckAction(e.target.value as PoaScopeAction)}
            >
              <option value="sale">{lang === 'bn' ? 'জমি বিক্রয় (Sale)' : 'Sale'}</option>
              <option value="mortgage">{lang === 'bn' ? 'বন্ধক রাখা (Mortgage)' : 'Mortgage'}</option>
              <option value="development">{lang === 'bn' ? 'উন্নয়ন চুক্তি (Development)' : 'Development'}</option>
              <option value="mutation">{lang === 'bn' ? 'নামজারি (Mutation)' : 'Mutation'}</option>
              <option value="litigation">{lang === 'bn' ? 'মামলা পরিচালনা (Litigation)' : 'Litigation'}</option>
              <option value="lease">{lang === 'bn' ? 'ইজারা প্রদান (Lease)' : 'Lease'}</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleVerify}>
            <I.search size={14} /> {lang === 'bn' ? 'বৈধতা গেট পরীক্ষা' : 'Run Gate Check'}
          </button>
        </div>

        {/* Verification Result Notification */}
        {verificationResult && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 6,
              background: verificationResult.isValid ? '#ecfdf5' : '#fff1f2',
              border: `1px solid ${verificationResult.isValid ? '#a7f3d0' : '#fecdd3'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {verificationResult.isValid ? (
              <I.checkCircle size={24} style={{ color: 'var(--success-600)', flexShrink: 0 }} />
            ) : (
              <I.alert size={24} style={{ color: 'var(--danger-600)', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <strong style={{ color: verificationResult.isValid ? '#065f46' : '#9f1239' }}>
                {verificationResult.isValid
                  ? (lang === 'bn' ? '✓ লেনদেন অনুমোদিত: আমমোক্তারনামা আইনসঙ্গত ও সক্রিয়' : '✓ Transaction Permitted: PoA Active & Authorized')
                  : (lang === 'bn' ? '⛔ লেনদেন ব্লক: রেজিস্ট্রেশন স্থগিতের নির্দেশ' : '⛔ Transaction Blocked: Security Invalidation')}
              </strong>
              <div style={{ fontSize: '0.86rem', color: verificationResult.isValid ? '#047857' : '#881337', marginTop: 2 }}>
                {lang === 'bn' ? verificationResult.messageBn : verificationResult.messageEn}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Digital Registry Table */}
      <div className="card">
        <div className="card__title">
          <h3><I.document size={16} /> {lang === 'bn' ? 'ডিজিটাল আমমোক্তারনামা কেন্দ্রীয় রেজিস্ট্রি' : 'Digital Power of Attorney Registry'}</h3>
          <span className="badge badge-outline">{registry.length} {lang === 'bn' ? 'টি দলিল নথিভুক্ত' : 'records registered'}</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ fontSize: '0.88rem' }}>
            <thead>
              <tr>
                <th>{lang === 'bn' ? 'দলিল নম্বর ও অফিস' : 'Deed No & Office'}</th>
                <th>{lang === 'bn' ? 'মূল মালিক (দাতা)' : 'Principal (Grantor)'}</th>
                <th>{lang === 'bn' ? 'আমমোক্তার (গ্রহীতা)' : 'Attorney (Agent)'}</th>
                <th>{lang === 'bn' ? 'অনুমোদিত দাগ / প্লট' : 'Permitted Plots'}</th>
                <th>{lang === 'bn' ? 'অনুমোদিত ক্ষমতা' : 'Action Scope'}</th>
                <th>{lang === 'bn' ? 'অবস্থা' : 'Status'}</th>
                <th style={{ textAlign: 'right' }}>{lang === 'bn' ? 'প্রশাসনিক পদক্ষেপ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {registry.map(p => (
                <tr key={p.id}>
                  <td>
                    <div><strong>{p.deedNo}</strong> ({p.executionDate.slice(0, 4)})</div>
                    <div className="muted text-xs">{p.subRegistryOfficeBn}</div>
                  </td>
                  <td>
                    <div><strong>{p.principalNameBn}</strong></div>
                    <div className="muted text-xs">NID: {p.principalNidMasked}</div>
                  </td>
                  <td>
                    <div><strong>{p.attorneyNameBn}</strong></div>
                    <div className="muted text-xs">NID: {p.attorneyNidMasked}</div>
                  </td>
                  <td>
                    <div>{p.linkedDagNumbers.join(', ')}</div>
                    <div className="muted text-xs">{p.linkedPlotIds.join(', ')}</div>
                  </td>
                  <td>
                    <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
                      {p.permittedScope.map((act: PoaScopeAction) => (
                        <span key={act} className="badge badge-outline" style={{ fontSize: '0.72rem' }}>
                          {act}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {p.status === 'active' && <span className="badge badge-success">{lang === 'bn' ? 'সক্রিয়' : 'Active'}</span>}
                    {p.status === 'revoked' && <span className="badge badge-danger">{lang === 'bn' ? 'বাতিলকৃত' : 'Revoked'}</span>}
                    {p.status === 'suspended' && <span className="badge badge-warn">{lang === 'bn' ? 'স্থগিত' : 'Suspended'}</span>}
                    {p.status === 'expired' && <span className="badge badge-outline">{lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Expired'}</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {p.status === 'active' && (
                      <div className="row gap-4 justify-end">
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--danger-700)', borderColor: 'var(--danger-300)' }}
                          onClick={() => setSelectedPoaForRevoke(p)}
                        >
                          <I.lock size={14} /> {lang === 'bn' ? 'বাতিল' : 'Revoke'}
                        </button>

                        <button
                          className="btn btn-ghost btn-sm"
                          title={lang === 'bn' ? 'মালিকের মৃত্যুর নোটিফিকেশন সিমুলেট করুন' : 'Simulate Principal Death Notification'}
                          onClick={() => handleSimulateDeath(p)}
                        >
                          <I.alert size={14} /> {lang === 'bn' ? 'মৃত্যু সতর্কতা' : 'Death Alert'}
                        </button>
                      </div>
                    )}

                    {p.status !== 'active' && (
                      <span className="muted text-xs">
                        {p.status === 'revoked' && (lang === 'bn' ? `বাতিল: ${p.revocationDeedNo || 'রেকর্ডভুক্ত'}` : 'Revoked')}
                        {p.status === 'suspended' && (lang === 'bn' ? 'ধারা ১২ স্বয়ংক্রিয় স্থগিত' : 'Sec 12 Suspended')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formal Revocation Modal with OTP Verification */}
      {selectedPoaForRevoke && (
        <div className="modal-overlay" onClick={() => setSelectedPoaForRevoke(null)}>
          <div className="modal-card" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleRevokeSubmit}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <I.lock size={24} style={{ color: 'var(--danger-600)' }} />
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {lang === 'bn' ? 'আইনসম্মত আমমোক্তারনামা প্রত্যাহার ও বাতিল' : 'Power of Attorney Formal Revocation'}
                    </h3>
                    <small className="muted">দলিল নং: {selectedPoaForRevoke.deedNo}</small>
                  </div>
                </div>
                <button type="button" className="icon-btn" onClick={() => setSelectedPoaForRevoke(null)}><I.close size={18} /></button>
              </div>

              <div className="modal-body" style={{ fontSize: '0.88rem' }}>
                <div style={{ background: '#fef2f2', padding: 10, borderRadius: 6, marginBottom: 12, color: '#991b1b', fontSize: '0.82rem' }}>
                  ⚠️ {lang === 'bn'
                    ? 'আমমোক্তারনামা আইন ২০১২ এর বিধান অনুযায়ী এই দলিল প্রত্যাহার সাব-রেজিস্ট্রি সেন্ট্রাল সিস্টেমে নিবন্ধিত হবে এবং অডিট লেজারে ক্রিপ্টোগ্রাফিকভাবে সংরক্ষিত হবে।'
                    : 'Formal revocation will be registered in Sub-Registry central Sentinel and recorded in the SHA-256 Audit Ledger.'}
                </div>

                <div className="mb-12">
                  <label className="label">{lang === 'bn' ? 'মূল মালিক (দাতা):' : 'Grantor:'}</label>
                  <div style={{ fontWeight: 600 }}>{selectedPoaForRevoke.principalNameBn} (NID: {selectedPoaForRevoke.principalNidMasked})</div>
                </div>

                <div className="mb-12">
                  <label className="label">{lang === 'bn' ? 'প্রত্যাহারের রেজিস্টার্ড দলিল নম্বর' : 'Revocation Registered Deed No'}</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={revocationDeedNo}
                    onChange={e => setRevocationDeedNo(e.target.value)}
                  />
                </div>

                <div className="mb-12">
                  <label className="label">{lang === 'bn' ? 'প্রত্যাহারের আইনি কারণ' : 'Legal Ground for Revocation'}</label>
                  <textarea
                    className="input"
                    rows={2}
                    required
                    value={revocationReason}
                    onChange={e => setRevocationReason(e.target.value)}
                  />
                </div>

                <div className="mb-12">
                  <label className="label">{lang === 'bn' ? 'নিরাপত্তা ওটিপি (সিমুলেটেড ৬-ডিজিট)' : 'Security OTP (Demo: 123456)'}</label>
                  <input
                    type="text"
                    className="input font-mono"
                    placeholder="123456"
                    required
                    value={enteredOtp}
                    onChange={e => setEnteredOtp(e.target.value)}
                  />
                  <div className="muted text-xs mt-4">
                    {lang === 'bn' ? 'মালিকের নিবন্ধিত মোবাইল নম্বরে প্রেরিত ওটিপি যাচাই' : 'Verified OTP sent to registered mobile'}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setSelectedPoaForRevoke(null)}>
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger-600)', borderColor: 'var(--danger-700)' }}>
                  <I.lock size={14} /> {lang === 'bn' ? 'চূড়ান্ত প্রত্যাহার কার্যকর করুন' : 'Execute Revocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
