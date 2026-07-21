import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiPhone, FiMapPin, FiLock, FiAward, FiGift, FiCamera, FiTrash2 } from 'react-icons/fi';
import { Spinner } from '../components/Loader';
import Modal from '../components/Modal';

const Profile = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Address/Phone States
  const [phone, setPhone] = useState('+91 ');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [govIdType, setGovIdType] = useState('None');
  const [govIdNumber, setGovIdNumber] = useState('');
  const [verifiedLoc, setVerifiedLoc] = useState('');
  const [updating, setUpdating] = useState(false);

  // KYC States
  const [kycRecord, setKycRecord] = useState(null);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);

  // KYC Form fields
  const [kycFullName, setKycFullName] = useState('');
  const [kycDob, setKycDob] = useState('');
  const [kycPanNumber, setKycPanNumber] = useState('');
  const [kycAadhaarNumber, setKycAadhaarNumber] = useState('');
  const [kycGstNumber, setKycGstNumber] = useState('');
  const [kycBankName, setKycBankName] = useState('');
  const [kycHolderName, setKycHolderName] = useState('');
  const [kycAccNumber, setKycAccNumber] = useState('');
  const [kycIfsc, setKycIfsc] = useState('');
  const [kycUpi, setKycUpi] = useState('');
  const [kycAddress, setKycAddress] = useState('');

  // File uploads
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [identityProofFile, setIdentityProofFile] = useState(null);
  const [addressProofFile, setAddressProofFile] = useState(null);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Referral States
  const [referralInput, setReferralInput] = useState('');
  const [applyingReferral, setApplyingReferral] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      let currentProfile = null;
      if (res.data.success) {
        currentProfile = res.data.data;
        setProfile(currentProfile);
        setPhone(currentProfile.phone || '+91 ');
        setStreet(currentProfile.address?.street || '');
        setCity(currentProfile.address?.city || '');
        setState(currentProfile.address?.state || '');
        setZip(currentProfile.address?.zip || '');
        setGovIdType(currentProfile.governmentIdType || 'None');
        setGovIdNumber(currentProfile.governmentIdNumber || '');
        setVerifiedLoc(currentProfile.verifiedLocation || '');
      }

      // Fetch KYC Status
      const kycRes = await api.get('/kyc/status');
      if (kycRes.data.success && kycRes.data.data) {
        const kycData = kycRes.data.data;
        setKycRecord(kycData);
        setKycFullName(kycData.fullName || '');
        if (kycData.dob) {
          setKycDob(new Date(kycData.dob).toISOString().split('T')[0]);
        }
        setKycPanNumber(kycData.panNumber || '');
        setKycAadhaarNumber(kycData.aadhaarNumber || '');
        setKycGstNumber(kycData.gstNumber || '');
        setKycBankName(kycData.bankName || '');
        setKycHolderName(kycData.accountHolderName || '');
        setKycAccNumber(kycData.accountNumber || '');
        setKycIfsc(kycData.ifscCode || '');
        setKycUpi(kycData.upiId || '');
        setKycAddress(kycData.address || '');
      } else if (currentProfile) {
        // Pre-fill from profile details
        setKycFullName(currentProfile.user?.name || '');
        const addrParts = [];
        if (currentProfile.address?.street) addrParts.push(currentProfile.address.street);
        if (currentProfile.address?.city) addrParts.push(currentProfile.address.city);
        if (currentProfile.address?.state) addrParts.push(currentProfile.address.state);
        if (currentProfile.address?.zip) addrParts.push(currentProfile.address.zip);
        setKycAddress(addrParts.join(', '));
      }
    } catch (err) {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await api.put('/users/profile', {
        phone,
        street,
        city,
        state,
        zip,
        governmentIdType: govIdType,
        governmentIdNumber: govIdNumber,
        verifiedLocation: verifiedLoc,
      });
      if (res.data.success) {
        toast.success('Profile details submitted for verification!');
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();

    if (!profilePhotoFile && (!kycRecord || !kycRecord.profilePhoto)) {
      return toast.error('Please upload your profile photo');
    }
    if (!identityProofFile && (!kycRecord || !kycRecord.identityProof)) {
      return toast.error('Please upload identity proof');
    }
    if (!addressProofFile && (!kycRecord || !kycRecord.addressProof)) {
      return toast.error('Please upload address proof');
    }

    setSubmittingKyc(true);
    const toastLoader = toast.loading('Uploading documents and submitting KYC...');
    try {
      const formData = new FormData();
      formData.append('fullName', kycFullName);
      formData.append('dob', kycDob);
      formData.append('panNumber', kycPanNumber);
      formData.append('aadhaarNumber', kycAadhaarNumber);
      formData.append('gstNumber', kycGstNumber);
      formData.append('bankName', kycBankName);
      formData.append('accountHolderName', kycHolderName);
      formData.append('accountNumber', kycAccNumber);
      formData.append('ifscCode', kycIfsc);
      formData.append('upiId', kycUpi);
      formData.append('address', kycAddress);

      if (profilePhotoFile) formData.append('profilePhoto', profilePhotoFile);
      if (identityProofFile) formData.append('identityProof', identityProofFile);
      if (addressProofFile) formData.append('addressProof', addressProofFile);

      const res = await api.post('/kyc/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        toast.success('KYC submitted successfully! Status is now Pending Review.', { id: toastLoader });
        setKycModalOpen(false);
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'KYC submission failed', { id: toastLoader });
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    const uploadToast = toast.loading('Uploading avatar photo...');
    try {
      const res = await api.post('/users/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success('Avatar photo updated!', { id: uploadToast });
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.message || 'Avatar upload failed', { id: uploadToast });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      toast.error(err.message || 'Password update failed');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleApplyReferral = async (e) => {
    e.preventDefault();
    setApplyingReferral(true);
    try {
      const res = await api.post('/users/referral', { referralCode: referralInput });
      if (res.data.success) {
        toast.success(res.data.message);
        setReferralInput('');
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to apply referral code');
    } finally {
      setApplyingReferral(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete your Solar Trade account? This action cannot be undone.')) return;

    try {
      const res = await api.delete('/users/account');
      if (res.data.success) {
        toast.success('Account deleted.');
        logout();
      }
    } catch (err) {
      toast.error('Deactivation failed');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left side: Avatar and Achievements */}
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-3xl shadow-glass text-center relative">
          <div className="relative h-24 w-24 mx-auto rounded-full bg-brand text-white text-3xl font-bold flex items-center justify-center overflow-hidden border-4 border-white shadow-premium">
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              profile?.user.name.charAt(0)
            )}
            <label className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
              <FiCamera className="text-white text-lg" />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <h3 className="font-bold text-lg mt-3">{profile?.user.name}</h3>
          <p className="text-xs text-slate-400">{profile?.user.email}</p>
          <div className="flex justify-center items-center gap-2 mt-2">
            <span className="inline-block rounded-full bg-brand/5 border border-brand/20 px-3 py-1 text-xs font-bold text-brand">
              {profile?.user.role}
            </span>
            <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${profile?.verificationStatus === 'Verified' ? 'bg-green-150 text-green-700 dark:bg-green-950/20 dark:text-green-400' :
                profile?.verificationStatus === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/10'
              }`}>
              {profile?.verificationStatus === 'Verified' ? `Verified (${profile?.verifiedLocation || 'India'})` : `Verification: ${profile?.verificationStatus || 'Pending'}`}
            </span>
          </div>

          {/* KYC Status Card and Button */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-left">
            <h4 className="text-xs font-bold text-slate-500 mb-2">KYC IDENTITY</h4>
            {!kycRecord ? (
              <div className="space-y-2">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                  Your identity is not verified. You cannot purchase energy plans or request solar plants until KYC is complete.
                </p>
                <button
                  onClick={() => setKycModalOpen(true)}
                  className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
                >
                  Complete Your KYC
                </button>
              </div>
            ) : kycRecord.status === 'Pending' || kycRecord.status === 'Under Review' ? (
              <div className="space-y-1.5 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  KYC Pending Review
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Submitted on {new Date(kycRecord.updatedAt).toLocaleDateString()}. Administrators are currently validating your documents.
                </p>
              </div>
            ) : kycRecord.status === 'Verified' ? (
              <div className="space-y-1 p-3 rounded-2xl bg-green-500/5 border border-green-500/20">
                <p className="text-xs font-bold text-green-600 dark:text-green-400">✓ KYC Approved</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Your account is fully verified for all green solar installations and tariff subscriptions.
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-3 rounded-2xl bg-red-500/5 border border-red-500/20">
                <p className="text-xs font-bold text-red-600 dark:text-red-400">✗ KYC Rejected</p>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Reason: {kycRecord.rejectionReason || 'Document mismatch'}
                </p>
                <button
                  onClick={() => setKycModalOpen(true)}
                  className="w-full rounded-2xl bg-red-500 hover:bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
                >
                  Resubmit KYC
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 mt-6 pt-4 flex justify-around text-sm">
            <div>
              <p className="text-xs text-slate-400 font-medium">REWARDS</p>
              <p className="font-bold text-brand">{profile?.rewardPoints || 0} pts</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">WALLET BALANCE</p>
              <p className="font-bold text-brand-emerald">₹{profile?.balance?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">MY REFERRAL</p>
              <p className="font-bold text-slate-500 dark:text-slate-400">{profile?.referralCode || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Badges Achievements */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FiAward /> Achievements & Badges
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile?.badges && profile.badges.length > 0 ? (
              profile.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-brand/5 border border-brand/20 px-3 py-1 text-xs font-bold text-brand-dark dark:text-brand-lime"
                >
                  {badge}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">Lock in contracts to earn achievements!</span>
            )}
          </div>

          {profile?.achievements && profile.achievements.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <p className="font-bold text-slate-400 uppercase">Unlocked Milestones</p>
              {profile.achievements.map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  <p className="font-bold">{item.title}</p>
                  <p className="text-slate-400 mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Account Settings */}
      <div className="lg:col-span-2 space-y-6">
        {/* Contact/Address Details */}
        <div className="glass-panel p-6 rounded-3xl shadow-glass">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <FiUser /> Contact Details & Address
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Street Address</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Hno Street, Area"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Hyderabad"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Telangana"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Zip Code</label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="XXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Govt Identity Verification (India)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">ID Document Type</label>
                  <select
                    value={govIdType}
                    onChange={(e) => setGovIdType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  >
                    <option value="None">None</option>
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="VoterID">Voter ID</option>
                    <option value="DriverLicense">Driving License</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Document Number</label>
                  <input
                    type="text"
                    value={govIdNumber}
                    onChange={(e) => setGovIdNumber(e.target.value)}
                    placeholder="e.g. Aadhaar/PAN number"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">State Location (India)</label>
                  <input
                    type="text"
                    value={verifiedLoc}
                    onChange={(e) => setVerifiedLoc(e.target.value)}
                    placeholder="e.g. Amritsar, Punjab"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="rounded-full bg-brand hover:bg-brand-dark px-5 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-50"
            >
              {updating ? 'Saving Details...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Change Password & Referral Code boxes in 2 cols */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Security */}
          <div className="glass-panel p-6 rounded-3xl shadow-glass">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <FiLock /> Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current Password"
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full rounded-2xl bg-brand text-white py-2.5 text-xs font-bold hover:bg-brand-dark transition-all disabled:opacity-50"
              >
                Save Password
              </button>
            </form>
          </div>

          {/* Referral Code Application */}
          <div className="glass-panel p-6 rounded-3xl shadow-glass flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                <FiGift /> Claim referral reward
              </h3>
              <p className="text-[10px] text-slate-400 mb-4 font-medium">
                Apply a friend's referral code to unlock +50 green reward points instantly.
              </p>
              {profile?.referredBy ? (
                <div className="rounded-2xl bg-brand/5 border border-brand/20 p-3 text-center text-xs font-bold text-brand">
                  Code applied: {profile.referredBy}
                </div>
              ) : (
                <form onSubmit={handleApplyReferral} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value)}
                    placeholder="ENTER REF CODE"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none uppercase"
                  />
                  <button
                    type="submit"
                    disabled={applyingReferral}
                    className="w-full rounded-2xl bg-brand text-white py-2.5 text-xs font-bold hover:bg-brand-dark transition-all disabled:opacity-50"
                  >
                    Apply Code
                  </button>
                </form>
              )}
            </div>

            <button
              onClick={handleDeleteAccount}
              className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 mt-4 transition-all"
            >
              <FiTrash2 /> Delete Account
            </button>
          </div>
        </div>
      </div>
      {/* KYC Verification Form Modal */}
      <Modal isOpen={kycModalOpen} onClose={() => setKycModalOpen(false)} title="Complete KYC Identity Verification">
        <form onSubmit={handleKycSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 py-1">
          <div className="bg-brand/5 border border-brand/10 p-3 rounded-2xl text-xs text-slate-500 leading-relaxed">
            Please fill in your legal details and upload document images. Your submissions are stored securely.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">FULL NAME (As on PAN/Aadhaar)</label>
              <input
                type="text"
                required
                value={kycFullName}
                onChange={(e) => setKycFullName(e.target.value)}
                placeholder="e.g. Aditya Sharma"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">DATE OF BIRTH</label>
              <input
                type="date"
                required
                value={kycDob}
                onChange={(e) => setKycDob(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">PAN CARD NUMBER</label>
              <input
                type="text"
                required
                maxLength="10"
                value={kycPanNumber}
                onChange={(e) => setKycPanNumber(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">AADHAAR NUMBER</label>
              <input
                type="text"
                required
                maxLength="12"
                value={kycAadhaarNumber}
                onChange={(e) => setKycAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="12-digit Aadhaar"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">GST NUMBER (Optional)</label>
              <input
                type="text"
                value={kycGstNumber}
                onChange={(e) => setKycGstNumber(e.target.value.toUpperCase())}
                placeholder="GSTIN Code"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none uppercase"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Bank Details (For Payouts)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">BANK NAME</label>
                <input
                  type="text"
                  required
                  value={kycBankName}
                  onChange={(e) => setKycBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">ACCOUNT HOLDER NAME</label>
                <input
                  type="text"
                  required
                  value={kycHolderName}
                  onChange={(e) => setKycHolderName(e.target.value)}
                  placeholder="As in bank records"
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 block mb-1">ACCOUNT NUMBER</label>
                <input
                  type="text"
                  required
                  value={kycAccNumber}
                  onChange={(e) => setKycAccNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Bank Account Number"
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">IFSC CODE</label>
                <input
                  type="text"
                  required
                  value={kycIfsc}
                  onChange={(e) => setKycIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0000123"
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none uppercase"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[10px] font-bold text-slate-400 block mb-1">UPI ID (Optional)</label>
              <input
                type="text"
                value={kycUpi}
                onChange={(e) => setKycUpi(e.target.value)}
                placeholder="username@bank"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">RESIDENTIAL ADDRESS</label>
              <textarea
                required
                rows="2"
                value={kycAddress}
                onChange={(e) => setKycAddress(e.target.value)}
                placeholder="Full Street Address, City, State & Zip Code"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Real file uploads for documents */}
          <div className="border-t border-slate-100 dark:border-slate-850 pt-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">File Verification Uploads</h4>
            
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">PROFILE PHOTO (Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhotoFile(e.target.files[0])}
                  className="w-full text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-2xl file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
                />
                {kycRecord?.profilePhoto && !profilePhotoFile && (
                  <span className="text-[10px] text-green-500 font-medium">✓ Keep current profile photo</span>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">IDENTITY PROOF (Aadhaar / PAN Card Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIdentityProofFile(e.target.files[0])}
                  className="w-full text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-2xl file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
                />
                {kycRecord?.identityProof && !identityProofFile && (
                  <span className="text-[10px] text-green-500 font-medium">✓ Keep current identity proof</span>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">ADDRESS PROOF (Utility Bill Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAddressProofFile(e.target.files[0])}
                  className="w-full text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-2xl file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
                />
                {kycRecord?.addressProof && !addressProofFile && (
                  <span className="text-[10px] text-green-500 font-medium">✓ Keep current address proof</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingKyc}
            className="w-full rounded-2xl bg-brand hover:bg-brand-dark py-3 text-xs font-bold text-white transition-all disabled:opacity-50 mt-4 shadow-sm"
          >
            {submittingKyc ? 'Uploading files and submitting...' : 'Submit KYC Details'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
