import React, { useState } from 'react';
import { useI18n } from '../i18n/provider';
import { I } from '../components/ui/Icons';
import { useToast } from '../components/ui/Toaster';
import {
  getAuditLedger,
  verifyLedgerIntegrity,
  simulateTamper,
  resetLedgerIntegrity,
  AuditEvent,
  AuditActorRole,
  AuditResourceType,
} from '../services/auditLedger';

export const AuditLedger: React.FC = () => {
  const { t, lang } = useI18n();
  const { show } = useToast();

  const [ledger, setLedger] = useState<AuditEvent[]>(() => getAuditLedger());
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<ReturnType<typeof verifyLedgerIntegrity> | null>(null);
  const [tamperEventId, setTamperEventId] = useState<string>(ledger[1]?.id || 'EVT-2026-0002');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  const handleVerifyIntegrity = () => {
    const result = verifyLedgerIntegrity();
    setIntegrityStatus(result);
    if (result.isValid) {
      show(
        'success',
        lang === 'bn'
          ? `লেজার চেইন সম্পূর্ণ অক্ষত! ${result.totalEvents}টি ব্লকের হ্যাশ নির্ভুল প্রমাণিত হয়েছে।`
          : `Ledger chain unbroken! All ${result.totalEvents} blocks verified successfully.`
      );
    } else {
      const firstErr = result.errors[0];
      show(
        'error',
        lang === 'bn'
          ? `সতর্কতা: ব্লক #${firstErr?.sequence || 1} এ ক্রিপ্টোগ্রাফিক অসঙ্গতি সনাক্ত হয়েছে!`
          : `Tamper Alert: Cryptographic mismatch detected at Block #${firstErr?.sequence || 1}!`
      );
    }
  };

  const handleSimulateTamper = () => {
    const success = simulateTamper(tamperEventId, {
      unauthorizedModification: true,
      tamperedAt: new Date().toISOString(),
      note: 'Malicious modification of land status record',
    });
    if (success) {
      const updated = getAuditLedger();
      setLedger(updated);
      const verify = verifyLedgerIntegrity();
      setIntegrityStatus(verify);
      show(
        'warn',
        lang === 'bn'
          ? `ইভেন্ট ${tamperEventId} এ তথ্য পরিবর্তন করা হয়েছে। ক্রিপ্টোগ্রাফিক যাচাইয়ে ত্রুটি ধরা পড়েছে!`
          : `Event ${tamperEventId} tampered. SHA-256 chain verification failed!`
      );
    }
  };

  const handleResetLedger = () => {
    resetLedgerIntegrity();
    const refreshed = getAuditLedger();
    setLedger(refreshed);
    setIntegrityStatus(verifyLedgerIntegrity());
    show(
      'info',
      lang === 'bn' ? 'অডিট লেজার পুনরায় প্রাথমিক ও বৈধ অবস্থায় ফিরিয়ে আনা হয়েছে।' : 'Audit ledger reset to pristine valid state.'
    );
  };

  const filteredEvents = ledger.filter(evt => {
    const matchesRole = roleFilter === 'ALL' || evt.actorRole === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      evt.id.toLowerCase().includes(q) ||
      evt.resourceId.toLowerCase().includes(q) ||
      evt.actionSummaryBn.toLowerCase().includes(q) ||
      evt.actionSummaryEn.toLowerCase().includes(q) ||
      evt.currentHash.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div>
          <div className="crumb"><I.shield size={14} /> {lang === 'bn' ? 'প্রশাসনিক নিরাপত্তা ও সুশাসন' : 'Governance & Security'}</div>
          <h1>{lang === 'bn' ? 'ক্রিপ্টোগ্রাফিক সিভিল সার্ভেন্ট অ্যাকশন লেজার' : 'Cryptographic Civil Servant Action Ledger'}</h1>
          <p className="muted" style={{ marginTop: -4 }}>
            {lang === 'bn'
              ? 'ভূমি কর্মকর্তাদের সকল প্রশাসনিক সিদ্ধান্ত ও মিউটেশনের অপরিবর্তনীয় SHA-256 হ্যাশ-শৃঙ্খলিত অডিট ট্রেইল'
              : 'Tamper-evident SHA-256 hash-chained audit trail recording land administration decisions and mutations'}
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn-outline" onClick={handleResetLedger}>
            <I.refresh size={16} /> {lang === 'bn' ? 'লেজার রিসেট' : 'Reset Ledger'}
          </button>
          <button className="btn btn-primary" onClick={handleVerifyIntegrity}>
            <I.checkCircle size={16} /> {lang === 'bn' ? 'লেজার ইন্টিগ্রিটি যাচাই করুন' : 'Verify Ledger Integrity'}
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {integrityStatus && (
        <div
          className="card mb-16"
          style={{
            background: integrityStatus.isValid ? '#ecfdf5' : '#fef2f2',
            borderColor: integrityStatus.isValid ? '#a7f3d0' : '#fecaca',
            borderLeft: `5px solid ${integrityStatus.isValid ? 'var(--success-600)' : 'var(--danger-600)'}`,
            padding: 14,
          }}
        >
          <div className="row gap-12" style={{ alignItems: 'center' }}>
            {integrityStatus.isValid ? (
              <I.checkCircle size={28} style={{ color: 'var(--success-600)', flexShrink: 0 }} />
            ) : (
              <I.alert size={28} style={{ color: 'var(--danger-600)', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '1rem', color: integrityStatus.isValid ? '#065f46' : '#991b1b' }}>
                {integrityStatus.isValid
                  ? (lang === 'bn' ? '✓ ক্রিপ্টোগ্রাফিক চেইন অক্ষত ও বৈধ' : '✓ Cryptographic Ledger Integrity Verified')
                  : (lang === 'bn' ? '⚠️ সতর্কতা: অডিট লেজারে তথ্য বিকৃতি বা টেম্পারিং সনাক্ত হয়েছে!' : '⚠️ Tamper Detected: Hash Chain Invalid!')}
              </strong>
              <div style={{ fontSize: '0.86rem', color: integrityStatus.isValid ? '#047857' : '#b91c1c', marginTop: 2 }}>
                {integrityStatus.isValid
                  ? (lang === 'bn'
                      ? `মোট ${integrityStatus.totalEvents}টি ব্লকের মধ্যে চেইনের প্রতিটি প্রিভিয়াস হ্যাশ এবং বর্তমান পে-লোড হ্যাশ নির্ভুলভাবে মিলেছে। কোনো অননুমোদিত পরিবর্তন হয়নি।`
                      : `All ${integrityStatus.totalEvents} blocks verified. Forward and backward SHA-256 hashes match canonical state.`)
                  : (lang === 'bn'
                      ? `ব্লক #${integrityStatus.errors[0]?.sequence || 1} এ তথ্য পরিবর্তন করার কারণে হ্যাশ শৃঙ্খল বিচ্ছিন্ন হয়েছে। কারণ: ${integrityStatus.errors[0]?.description || 'ক্রিপ্টোগ্রাফিক অমিল'}`
                      : `Chain broken at Block #${integrityStatus.errors[0]?.sequence || 1}. Reason: ${integrityStatus.errors[0]?.description || 'Cryptographic mismatch'}`)}
              </div>
            </div>
            <button className="btn btn-sm btn-outline" onClick={() => setShowQrModal(true)}>
              <I.qr size={14} /> {lang === 'bn' ? 'পাবলিক অডিট কিউআর' : 'Public Audit QR'}
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-4 mb-16">
        <div className="kpi k-info">
          <div className="kpi__label">{lang === 'bn' ? 'মোট নথিভুক্ত ব্লক' : 'Total Chained Blocks'}</div>
          <div className="kpi__value">{ledger.length}</div>
          <small className="muted">{lang === 'bn' ? 'জেনেসিস ব্লক থেকে সংযুক্ত' : 'Linked from Genesis Block'}</small>
        </div>

        <div className="kpi k-success">
          <div className="kpi__label">{lang === 'bn' ? 'হ্যাশিং স্ট্যান্ডার্ড' : 'Hashing Standard'}</div>
          <div className="kpi__value" style={{ fontSize: '1.25rem' }}>SHA-256</div>
          <small className="muted">{lang === 'bn' ? 'ক্যানোনিকাল জেসন সিরিয়ালাইজড' : 'Canonical RFC-8785 JSON'}</small>
        </div>

        <div className="kpi k-warn">
          <div className="kpi__label">{lang === 'bn' ? 'স্বাক্ষরকারী কর্মকর্তা' : 'Authorized Officers'}</div>
          <div className="kpi__value">
            {new Set(ledger.map(e => e.actorId)).size}
          </div>
          <small className="muted">{lang === 'bn' ? 'এসি ল্যান্ড, কানুনগো ও সাব-রেজিস্ট্রার' : 'AC Land, Sub-Registrar & Kanungo'}</small>
        </div>

        <div className="kpi k-purple">
          <div className="kpi__label">{lang === 'bn' ? 'লেজার অবস্থা' : 'Chain Health'}</div>
          <div className="kpi__value" style={{ fontSize: '1.2rem', color: integrityStatus?.isValid === false ? 'var(--danger-600)' : 'var(--success-600)' }}>
            {integrityStatus?.isValid === false
              ? (lang === 'bn' ? 'বিচ্ছিন্ন (Tampered)' : 'Compromised')
              : (lang === 'bn' ? 'নিরাপদ (Verified)' : '100% Intact')}
          </div>
          <small className="muted">{lang === 'bn' ? 'ডিজিটাল এভিডেন্স রেডি' : 'Tamper-Evident Standard'}</small>
        </div>
      </div>

      {/* Interactive Tampering Simulation Control Box */}
      <div className="card mb-16" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
        <div className="card__title">
          <h3><I.lock size={16} /> {lang === 'bn' ? 'টেম্পার-প্রতিরোধ সিমুলেশন পরীক্ষা (Security Demonstration)' : 'Tamper-Resistance Security Simulation'}</h3>
          <span className="badge badge-purple">{lang === 'bn' ? 'ইন্টারেক্টিভ ল্যাব' : 'Interactive Lab'}</span>
        </div>
        <p className="muted text-sm" style={{ marginTop: -4 }}>
          {lang === 'bn'
            ? 'ডাটাবেজে কোনো অসদুপায়ী কর্মকর্তা যদি সরাসরি পে-লোড পরিবর্তন করেন, তাহলে চেইন কীভাবে তাৎক্ষণিক অসঙ্গতি চিহ্নিত করে তা সরাসরি পরীক্ষা করুন:'
            : 'Simulate unauthorized administrative database alteration to observe immediate cryptographic failure in the hash-chain:'}
        </p>

        <div className="row gap-12" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{lang === 'bn' ? 'ব্লক নির্বাচন:' : 'Target Block:'}</span>
            <select
              className="select"
              style={{ width: 170 }}
              value={tamperEventId}
              onChange={e => setTamperEventId(e.target.value)}
            >
              {ledger.map((evt, idx) => (
                <option key={evt.id} value={evt.id}>
                  #{evt.sequence} - {evt.id}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-outline" style={{ color: 'var(--danger-700)', borderColor: 'var(--danger-300)' }} onClick={handleSimulateTamper}>
            <I.alert size={14} /> {lang === 'bn' ? 'ব্লক পে-লোডে টেম্পার সিমুলেট করুন' : 'Simulate Payload Tampering'}
          </button>

          <button className="btn btn-outline" onClick={handleResetLedger}>
            <I.refresh size={14} /> {lang === 'bn' ? 'পুনরুদ্ধার ও রিসিঙ্ক' : 'Restore Pristine State'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="row gap-12 mb-16" style={{ alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            className="input"
            placeholder={lang === 'bn' ? 'ইভেন্ট আইডি, দাগ/রিসোর্স, অথবা হ্যাশ দিয়ে খুঁজুন...' : 'Search by event ID, resource ID, or hash...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ width: 220 }}>
          <select className="select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="ALL">{lang === 'bn' ? 'সকল কর্মকর্তা ও সিস্টেম' : 'All Roles & System'}</option>
            <option value="AC_LAND">{lang === 'bn' ? 'এসি ল্যান্ড (AC Land)' : 'AC Land'}</option>
            <option value="SUB_REGISTRAR">{lang === 'bn' ? 'সাব-রেজিস্ট্রার (Sub-Registrar)' : 'Sub-Registrar'}</option>
            <option value="KANUNGO">{lang === 'bn' ? 'কানুনগো (Kanungo)' : 'Kanungo'}</option>
            <option value="SURVEYOR">{lang === 'bn' ? 'সার্ভেয়ার (Surveyor)' : 'Surveyor'}</option>
            <option value="ADMIN">{lang === 'bn' ? 'প্রশাসক (Admin)' : 'Admin'}</option>
            <option value="SYSTEM">{lang === 'bn' ? 'স্বয়ংক্রিয় সিস্টেম (System)' : 'System'}</option>
          </select>
        </div>
      </div>

      {/* Ledger Block Explorer List */}
      <div className="card">
        <div className="card__title">
          <h3><I.chain size={16} /> {lang === 'bn' ? 'অপরিবর্তনীয় ব্লক চেইনের তালিকা' : 'Immutable Hash-Chained Action Stream'}</h3>
          <span className="badge badge-outline">{filteredEvents.length} {lang === 'bn' ? 'টি ব্লক প্রদর্শিত' : 'blocks shown'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredEvents.map((evt, idx) => {
            const isGenesis = evt.sequence === 0;
            return (
              <div
                key={evt.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  padding: 14,
                  background: 'var(--surface)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Block header */}
                <div className="row justify-between" style={{ alignItems: 'center', marginBottom: 8 }}>
                  <div className="row gap-8" style={{ alignItems: 'center' }}>
                    <span
                      style={{
                        background: 'var(--primary-800)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      BLOCK #{evt.sequence}
                    </span>
                    <strong style={{ fontSize: '0.95rem' }}>{evt.id}</strong>
                    <span className="badge badge-info">{evt.actorRole}</span>
                    <span className="badge badge-outline">{evt.resourceType}: {evt.resourceId}</span>
                  </div>

                  <div className="muted text-xs">
                    {new Date(evt.timestamp).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                  </div>
                </div>

                {/* Action Summary */}
                <div style={{ fontSize: '0.92rem', color: 'var(--ink-800)', marginBottom: 10 }}>
                  {lang === 'bn' ? evt.actionSummaryBn : evt.actionSummaryEn}
                </div>

                {/* Hashes Row */}
                <div
                  style={{
                    background: 'var(--ink-50)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    fontSize: '0.76rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div className="row gap-8" style={{ alignItems: 'center' }}>
                    <span style={{ width: 100, color: 'var(--ink-500)', fontWeight: 600 }}>PREV HASH:</span>
                    <span style={{ color: isGenesis ? 'var(--ink-400)' : 'var(--ink-700)' }}>
                      {isGenesis ? 'GENESIS_PREV_HASH (00000000000000000000000000000000)' : evt.previousHash}
                    </span>
                  </div>

                  <div className="row gap-8" style={{ alignItems: 'center' }}>
                    <span style={{ width: 100, color: 'var(--primary-700)', fontWeight: 600 }}>BLOCK HASH:</span>
                    <strong style={{ color: 'var(--primary-800)' }}>{evt.currentHash}</strong>
                  </div>
                </div>

                {/* Expand / Details Button */}
                <div className="row justify-between mt-8" style={{ alignItems: 'center' }}>
                  <div className="muted text-xs">
                    {lang === 'bn' ? 'সম্পাদনাকারী:' : 'Actor:'} <strong>{evt.actorId}</strong>
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedEvent(selectedEvent?.id === evt.id ? null : evt)}
                  >
                    <I.eye size={14} /> {selectedEvent?.id === evt.id ? (lang === 'bn' ? 'সংক্ষিপ্ত করুন' : 'Hide Payload') : (lang === 'bn' ? 'সম্পূর্ণ পে-লোড দেখুন' : 'Inspect Payload')}
                  </button>
                </div>

                {/* Payload JSON Inspector */}
                {selectedEvent?.id === evt.id && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 10,
                      background: '#1e293b',
                      color: '#f8fafc',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      overflowX: 'auto',
                    }}
                  >
                    <div style={{ color: '#94a3b8', marginBottom: 4 }}>// Canonical Canonicalized Payload:</div>
                    <pre style={{ margin: 0 }}>{JSON.stringify(evt.payload, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Public QR Audit Modal */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <I.qr size={24} style={{ color: 'var(--primary-700)' }} />
                <div>
                  <h3 style={{ margin: 0 }}>
                    {lang === 'bn' ? 'সার্বজনীন ডিজিটাল অডিট ভেরিফিকেশন' : 'Public Digital Verification'}
                  </h3>
                  <small className="muted">{lang === 'bn' ? 'নাগরিক ও আদালতের জন্য যাচাইযোগ্য সিল' : 'Verifiable Public Audit Proof'}</small>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowQrModal(false)}><I.close size={18} /></button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 180,
                  height: 180,
                  margin: '0 auto 16px',
                  background: '#f8fafc',
                  border: '2px dashed var(--border-color)',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <I.qr size={96} style={{ color: 'var(--ink-800)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--ink-500)', fontFamily: 'monospace' }}>
                  SHA256: {ledger[ledger.length - 1]?.currentHash.slice(0, 16)}...
                </span>
              </div>

              <div style={{ textAlign: 'left', background: 'var(--ink-50)', padding: 12, borderRadius: 6, fontSize: '0.84rem' }}>
                <div className="mb-4"><strong>{lang === 'bn' ? 'লেজার শীর্ষ হ্যাশ:' : 'Head Hash:'}</strong></div>
                <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--primary-800)' }}>
                  {ledger[ledger.length - 1]?.currentHash}
                </div>
                <div className="mt-8 text-xs muted">
                  {lang === 'bn'
                    ? 'এই কিউআর কোড স্ক্যান করে যে-কেউ কোনো অভ্যন্তরীণ গোপনীয় তথ্য ছাড়াই প্রশাসনিক সিদ্ধান্তের সত্যতা ক্রিপ্টোগ্রাফিক পদ্ধতিতে যাচাই করতে পারবেন।'
                    : 'Scan this cryptographic seal to independently verify procedural authenticity without exposing private civil servant PII.'}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowQrModal(false)}>
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button className="btn btn-primary" onClick={() => {
                navigator.clipboard?.writeText(ledger[ledger.length - 1]?.currentHash || '');
                show('success', lang === 'bn' ? 'হ্যাশ ক্লিপবোর্ডে কপি হয়েছে' : 'Head Hash copied');
              }}>
                <I.check size={14} /> {lang === 'bn' ? 'হ্যাশ কপি করুন' : 'Copy Proof Hash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
